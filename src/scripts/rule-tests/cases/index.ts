import type { Case } from '../types';
import joinAsteriskInDecl from './join-asterisk-in-decl';
import percentBuiltins from './percent-builtins';
import ctlOptParentheses from './ctl-opt-parentheses';
import operatorSpacingBasic from './operator-spacing-basic';
import specialValuesJoin from './special-values-join';
import onErrorSpecialValue from './on-error-special-value';
import continuationAlignment from './continuation-alignment';
import declJoinAsteriskProto from './decl-join-asterisk-proto';
import ctlOptOptionsCollapse from './ctl-opt-options-collapse';
import inlineStatementSplit from './inline-statement-split';
import stringParenthesesTrim from './string-parentheses-trim';
import spaceCollapseBetweenTokens from './space-collapse-between-tokens';
import percentBuiltinsSpacing from './percent-builtins-spacing';
import multiplicationSpacing from './multiplication-spacing';
import parenthesesTrim from './parentheses-trim';
import stringWrapConcat from './string-wrap-concat';
import multilineStringNormalization from './multiline-string-normalization';
import wrapLeadingPlusLiteral from './wrap-leading-plus-literal';
import concatOnePerLine from './concat-one-per-line';
import continuationColumnIndentAware from './continuation-column-indent-aware';
import trimSpaceBeforeSemicolon from './trim-space-before-semicolon';
import multilineStringDisabled from './multiline-string-disabled';
import specialValueSpacingAfterOperators from './special-value-spacing-after-operators';
import percentBuiltinNoSpace from './percent-builtin-no-space';
import wrapLongLiteralNewLine from './wrap-long-literal-new-line';
import booleanAssignmentWrap from './boolean-assignment-wrap';
import avoidSplitInsideParens from './avoid-split-inside-parens';
import execSqlFormatting from './exec-sql-formatting';
import execSqlUpdateDelete from './exec-sql-update-delete';
import execSqlCallSetCommit from './exec-sql-call-set-commit';
import execSqlMerge from './exec-sql-merge';
import execSqlPrepareExecute from './exec-sql-prepare-execute';
import execSqlCursor from './exec-sql-cursor';
import execSqlHost from './exec-sql-host';
import execSqlConnection from './exec-sql-connection';
import execSqlDescribeAllocate from './exec-sql-describe-allocate';
import execSqlCteUnion from './exec-sql-cte-union';
import execSqlValues from './exec-sql-values';
import execSqlCteMulti from './exec-sql-cte-multi';
import execSqlExecImmediateUsing from './exec-sql-exec-immediate-using';
import execSqlFetchVariants from './exec-sql-fetch-variants';

export const cases: Case[] = [
  joinAsteriskInDecl,
  percentBuiltins,
  ctlOptParentheses,
  operatorSpacingBasic,
  specialValuesJoin,
  onErrorSpecialValue,
  continuationAlignment,
  declJoinAsteriskProto,
  ctlOptOptionsCollapse,
  inlineStatementSplit,
  stringParenthesesTrim,
  spaceCollapseBetweenTokens,
  percentBuiltinsSpacing,
  multiplicationSpacing,
  parenthesesTrim,
  stringWrapConcat,
  multilineStringNormalization,
  wrapLeadingPlusLiteral,
  concatOnePerLine,
  continuationColumnIndentAware,
  trimSpaceBeforeSemicolon,
  multilineStringDisabled,
  specialValueSpacingAfterOperators,
  percentBuiltinNoSpace,
  wrapLongLiteralNewLine,
  booleanAssignmentWrap,
  avoidSplitInsideParens,
  execSqlFormatting,
  execSqlUpdateDelete,
  execSqlCallSetCommit,
  execSqlMerge,
  execSqlPrepareExecute,
  execSqlCursor,
  execSqlHost,
  execSqlConnection,
  execSqlDescribeAllocate,
  execSqlCteUnion,
  execSqlValues,
  execSqlCteMulti,
  execSqlExecImmediateUsing,
  execSqlFetchVariants
];
