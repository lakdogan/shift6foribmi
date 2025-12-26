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
import execSqlWhenever from './exec-sql-whenever';
import execSqlConnectionVariants from './exec-sql-connection-variants';
import execSqlSelectClauses from './exec-sql-select-clauses';
import execSqlUpdateVariants from './exec-sql-update-variants';
import execSqlDeleteVariants from './exec-sql-delete-variants';
import execSqlMergeDelete from './exec-sql-merge-delete';
import execSqlDescribeVariants from './exec-sql-describe-variants';
import execSqlTransactionVariants from './exec-sql-transaction-variants';
import execSqlPrepareVariants from './exec-sql-prepare-variants';
import execSqlOffsetFetch from './exec-sql-offset-fetch';
import execSqlForUpdateOf from './exec-sql-for-update-of';
import execSqlSetCurrent from './exec-sql-set-current';
import execSqlDescribeInputOutput from './exec-sql-describe-input-output';
import execSqlFetchRowset from './exec-sql-fetch-rowset';
import execSqlDeclareCursorOptions from './exec-sql-declare-cursor-options';
import execSqlPrepareWithOptions from './exec-sql-prepare-with-options';
import execSqlValuesInto from './exec-sql-values-into';
import execSqlSavepoint from './exec-sql-savepoint';
import execSqlSetOption from './exec-sql-set-option';
import execSqlOpenUsing from './exec-sql-open-using';
import execSqlExecuteInto from './exec-sql-execute-into';
import execSqlSelectInto from './exec-sql-select-into';
import execSqlJoins from './exec-sql-joins';
import execSqlOrderByNulls from './exec-sql-order-by-nulls';
import execSqlMergeConditions from './exec-sql-merge-conditions';
import execSqlGroupByRollup from './exec-sql-group-by-rollup';
import execSqlHavingLogic from './exec-sql-having-logic';
import execSqlForReadOnly from './exec-sql-for-read-only';
import execSqlSelectCurrentOf from './exec-sql-select-current-of';
import execSqlSetSpecialRegister from './exec-sql-set-special-register';
import execSqlSetConnectionReset from './exec-sql-set-connection-reset';

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
  execSqlFetchVariants,
  execSqlWhenever,
  execSqlConnectionVariants,
  execSqlSelectClauses,
  execSqlUpdateVariants,
  execSqlDeleteVariants,
  execSqlMergeDelete,
  execSqlDescribeVariants,
  execSqlTransactionVariants,
  execSqlPrepareVariants,
  execSqlOffsetFetch,
  execSqlForUpdateOf,
  execSqlSetCurrent,
  execSqlDescribeInputOutput,
  execSqlFetchRowset,
  execSqlDeclareCursorOptions,
  execSqlPrepareWithOptions,
  execSqlValuesInto,
  execSqlSavepoint,
  execSqlSetOption,
  execSqlOpenUsing,
  execSqlExecuteInto,
  execSqlSelectInto,
  execSqlJoins,
  execSqlOrderByNulls,
  execSqlMergeConditions,
  execSqlGroupByRollup,
  execSqlHavingLogic,
  execSqlForReadOnly,
  execSqlSelectCurrentOf,
  execSqlSetSpecialRegister,
  execSqlSetConnectionReset
];
