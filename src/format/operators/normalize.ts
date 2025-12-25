import { Shift6Config } from '../../config';
import { findCommentIndexOutsideStrings } from '../utils/string-scan';
import {
  buildContextPattern,
  buildNormalizeSteps,
  NormalizeStepContext
} from './normalize-helpers/pipeline-steps';

// Apply all operator-level normalizations for a single line.
export function normalizeOperatorSpacing(line: string, cfg: Shift6Config): string {
  const trimmedStart = line.trimStart();
  const isCtlOptLine = trimmedStart.toUpperCase().startsWith('CTL-OPT');
  const isDeclLine = (() => {
    const upper = trimmedStart.toUpperCase();
    return upper.startsWith('DCL-PI') || upper.startsWith('DCL-PR') || upper.startsWith('DCL-PROC');
  })();

  if (trimmedStart.startsWith('//')) {
    return line;
  }

  const commentIndex = findCommentIndexOutsideStrings(line);
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  const match = codePart.match(/^(\s*)(.*)$/);
  const indent = match ? match[1] : '';
  let rest = match ? match[2] : codePart;

  const contextPattern = buildContextPattern();
  const stepContext: NormalizeStepContext = {
    cfg,
    isCtlOptLine,
    isDeclLine,
    contextPattern
  };
  const steps = buildNormalizeSteps(stepContext);
  for (const step of steps) {
    rest = step(rest, stepContext);
  }

  const trimmedRest = rest.replace(/[ \t]+$/g, '');
  const commentSpacer = commentPart && trimmedRest.length > 0 ? ' ' : '';
  return indent + trimmedRest + commentSpacer + commentPart;
}
