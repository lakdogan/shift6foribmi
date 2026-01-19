import { Shift6Config } from '../../config';
import {
  buildLineInfo,
  getLineFlags,
  initFormatContext,
  updateContextAfterLine,
  updateContextBeforeLine
} from '../context';
import { countLeadingSpaces } from '../utils';
import { findCommentIndexOutsideStrings, scanOutsideStrings } from '../utils/string-scan';
import { PreprocessResult } from '../preprocess';
import { FormatCoreResult } from '../types';
import { Rule } from './types';

// Execute all formatting rules in order, tracking context and changes.
export function runRules(pre: PreprocessResult, cfg: Shift6Config, rules: Rule[]): FormatCoreResult {
  const resultLines: string[] = [];
  let anyChanged = false;

  const lineInfos = pre.linesToProcess.map((line) => buildLineInfo(line));
  const lineFlags = lineInfos.map((info) => getLineFlags(info));
  const ctxBefore: Array<ReturnType<typeof initFormatContext>> = [];

  let probeCtx = initFormatContext();
  for (let i = 0; i < lineInfos.length; i++) {
    const flags = lineFlags[i];
    probeCtx = updateContextBeforeLine(probeCtx, flags);
    ctxBefore[i] = probeCtx;
    probeCtx = updateContextAfterLine(probeCtx, flags);
  }

  const paramContinuationDepth: number[] = new Array(lineInfos.length).fill(0);
  let parenDepth = 0;
  for (let i = 0; i < lineInfos.length; i++) {
    paramContinuationDepth[i] = parenDepth;
    const line = lineInfos[i].original;
    const commentIndex = findCommentIndexOutsideStrings(line);
    const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
    scanOutsideStrings(codePart, (ch) => {
      if (ch === '(') {
        parenDepth++;
      } else if (ch === ')') {
        parenDepth = Math.max(0, parenDepth - 1);
      }
    });
  }

  const desiredIndent = lineInfos.map((info, index) => {
    const ctx = ctxBefore[index];
    const currentIndent = countLeadingSpaces(info.original);
    const trimmedStart = info.original.trimStart();
    const continuationOffset = ctx.pendingAssignmentContinuation ? cfg.blockIndent : 0;
    const target = cfg.targetBaseIndent + ctx.indentLevel * cfg.blockIndent + continuationOffset;
    if (ctx.execSqlDepth > 0 && !trimmedStart.startsWith('//')) {
      return target + currentIndent;
    }
    const preserveIndent =
      !cfg.alignProcedureCallParameters &&
      paramContinuationDepth[index] > 0 &&
      !trimmedStart.startsWith('//');
    if (preserveIndent && currentIndent > target) {
      return currentIndent;
    }
    return target;
  });

  const commentIndentOverrides: Array<number | null> = new Array(lineInfos.length).fill(null);
  for (let i = 0; i < lineInfos.length; i++) {
    const trimmedStart = lineInfos[i].original.trimStart();
    if (!trimmedStart.startsWith('//')) continue;
    for (let j = i + 1; j < lineInfos.length; j++) {
      if (lineFlags[j].isCommentOnly) continue;
      commentIndentOverrides[i] = desiredIndent[j];
      break;
    }
  }

  let ctx = initFormatContext();

  resultLines.push(cfg.normalizedFree);
  if (cfg.normalizedFree !== pre.firstLineText) {
    anyChanged = true;
  }

  for (let index = 0; index < pre.linesToProcess.length; index++) {
    const original = pre.linesToProcess[index];
    const info = lineInfos[index];
    const flags = lineFlags[index];

    ctx = updateContextBeforeLine(ctx, flags);

    let state = {
      original,
      current: original,
      info,
      targetIndent: cfg.targetBaseIndent + ctx.indentLevel * cfg.blockIndent,
      commentIndentOverride: commentIndentOverrides[index],
      paramContinuationDepth: paramContinuationDepth[index]
    };

    for (const rule of rules) {
      const result = rule.apply(state, ctx, cfg, flags);
      state = result.state;
      ctx = result.ctx;
      if (result.changed) {
        anyChanged = true;
      }
    }

    resultLines.push(state.current);
    if (state.current !== original) {
      anyChanged = true;
    }

    ctx = updateContextAfterLine(ctx, flags);
  }

  return { resultLines, anyChanged };
}
