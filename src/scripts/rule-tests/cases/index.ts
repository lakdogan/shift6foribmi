import type { Case } from '../types';
import joinAsteriskInDecl from './join-asterisk-in-decl';
import percentBuiltins from './percent-builtins';
import ctlOptParentheses from './ctl-opt-parentheses';
import operatorSpacingBasic from './operator-spacing-basic';
import specialValuesJoin from './special-values-join';
import onErrorSpecialValue from './on-error-special-value';
import continuationAlignment from './continuation-alignment';
import procedureCallParamAlignment from './procedure-call-param-alignment';
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
import execSqlWheneverGoto from './exec-sql-whenver-goto';
import execSqlExecImmediateInto from './exec-sql-exec-immediate-into';
import execSqlDescribeUsing from './exec-sql-describe-using';
import execSqlLockTable from './exec-sql-lock-table';
import execSqlSetCurrentOptions from './exec-sql-set-current-options';
import execSqlMergeNotMatchedDelete from './exec-sql-merge-not-matched-delete';
import execSqlSetPathList from './exec-sql-set-path-list';
import execSqlSetTransaction from './exec-sql-set-transaction';
import execSqlWheneverContinue from './exec-sql-whenever-continue';
import execSqlCallWithParams from './exec-sql-call-with-params';
import execSqlSetTransactionMode from './exec-sql-set-transaction-mode';
import execSqlConnectUsing from './exec-sql-connect-using';
import execSqlUsingDescriptor from './exec-sql-using-descriptor';
import execSqlIntersect from './exec-sql-intersect';
import execSqlExcept from './exec-sql-except';
import execSqlForFetchOnly from './exec-sql-for-fetch-only';
import execSqlSetSession from './exec-sql-set-session';
import execSqlLockTableVariants from './exec-sql-lock-table-variants';
import execSqlSetSessionCurrent from './exec-sql-set-session-current';
import execSqlDynamicVariants from './exec-sql-dynamic-variants';
import execSqlDmlEdgeVariants from './exec-sql-dml-edge-variants';
import execSqlSelectEdgeVariants from './exec-sql-select-edge-variants';
import execSqlSessionTransactionBlock from './exec-sql-session-transaction-block';
import execSqlCursorBlock from './exec-sql-cursor-block';
import execSqlHostConnectionBlock from './exec-sql-host-connection-block';
import execSqlJoinDedup from './exec-sql-join-dedup';
import execSqlDdlSchema from './exec-sql-ddl-schema';
import execSqlDb2iHints from './exec-sql-db2i-hints';
import execSqlSelectAdvanced from './exec-sql-select-advanced';
import execSqlDmlSpecials from './exec-sql-dml-specials';
import execSqlDiagnosticsSession from './exec-sql-diagnostics-session';
import execSqlCursorDescriptor from './exec-sql-cursor-descriptor';
import execSqlFunctions from './exec-sql-functions';
import execSqlPsmBlocks from './exec-sql-psm-blocks';
import execSqlTriggerBody from './exec-sql-trigger-body';
import execSqlWindowFunctions from './exec-sql-window-functions';
import execSqlSubqueryJoins from './exec-sql-subquery-joins';
import execSqlJsonXml from './exec-sql-json-xml';
import execSqlDdlOptions from './exec-sql-ddl-options';
import execSqlSpecialRegisters from './exec-sql-special-registers';
import execSqlCteRecursive from './exec-sql-cte-recursive';
import execSqlTriggerReferencing from './exec-sql-trigger-referencing';
import execSqlPsmHandlers from './exec-sql-psm-handlers';
import execSqlWindowFrame from './exec-sql-window-frame';
import execSqlJsonTable from './exec-sql-json-table';
import execSqlXmltableNamespaces from './exec-sql-xmltable-namespaces';
import execSqlSpecialRegistersExtended from './exec-sql-special-registers-extended';
import execSqlDdlOptionsExtended from './exec-sql-ddl-options-extended';
import execSqlMergeAdvanced from './exec-sql-merge-advanced';
import execSqlUpdateFromSubquery from './exec-sql-update-from-subquery';
import execSqlDeleteUsingSubselect from './exec-sql-delete-using-subselect';
import execSqlSetOperationsOrder from './exec-sql-set-operations-order';

export const cases: Case[] = [
  joinAsteriskInDecl,
  percentBuiltins,
  ctlOptParentheses,
  operatorSpacingBasic,
  specialValuesJoin,
  onErrorSpecialValue,
  continuationAlignment,
  procedureCallParamAlignment,
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
  execSqlSetConnectionReset,
  execSqlWheneverGoto,
  execSqlExecImmediateInto,
  execSqlDescribeUsing,
  execSqlLockTable,
  execSqlSetCurrentOptions,
  execSqlMergeNotMatchedDelete,
  execSqlSetPathList,
  execSqlSetTransaction,
  execSqlWheneverContinue,
  execSqlCallWithParams,
  execSqlSetTransactionMode,
  execSqlConnectUsing,
  execSqlUsingDescriptor,
  execSqlIntersect,
  execSqlExcept,
  execSqlForFetchOnly,
  execSqlSetSession,
  execSqlLockTableVariants,
  execSqlSetSessionCurrent,
  execSqlDynamicVariants,
  execSqlDmlEdgeVariants,
  execSqlSelectEdgeVariants,
  execSqlSessionTransactionBlock,
  execSqlCursorBlock,
  execSqlHostConnectionBlock,
  execSqlJoinDedup,
  execSqlDdlSchema,
  execSqlDb2iHints,
  execSqlSelectAdvanced,
  execSqlDmlSpecials,
  execSqlDiagnosticsSession,
  execSqlCursorDescriptor,
  execSqlFunctions,
  execSqlPsmBlocks,
  execSqlTriggerBody,
  execSqlWindowFunctions,
  execSqlSubqueryJoins,
  execSqlJsonXml,
  execSqlDdlOptions,
  execSqlSpecialRegisters,
  execSqlCteRecursive,
  execSqlTriggerReferencing,
  execSqlPsmHandlers,
  execSqlWindowFrame,
  execSqlJsonTable,
  execSqlXmltableNamespaces,
  execSqlSpecialRegistersExtended,
  execSqlDdlOptionsExtended,
  execSqlMergeAdvanced,
  execSqlUpdateFromSubquery,
  execSqlDeleteUsingSubselect,
  execSqlSetOperationsOrder
];
