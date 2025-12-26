# Exec SQL Scope

This file defines the full statement coverage target for exec sql formatting.

## DML
- SELECT
- INSERT
- UPDATE
- DELETE
- MERGE

## Cursor
- DECLARE CURSOR
- OPEN
- FETCH
- CLOSE

## Diagnostics / Control
- GET DIAGNOSTICS
- SET
- CALL

## Transaction
- COMMIT
- ROLLBACK

## Prepare / Dynamic
- PREPARE
- EXECUTE
- EXECUTE IMMEDIATE
- DESCRIBE
- ALLOCATE
- DEALLOCATE

## Connection / Environment
- CONNECT
- SET CONNECTION
- DISCONNECT
- RELEASE

## Precompile / Host
- DECLARE SECTION
- INCLUDE SQLCA
- WHENEVER

## SQL Clauses / Combinators
- WITH (CTE)
- UNION / UNION ALL
- INTERSECT
- EXCEPT
- VALUES (table)
