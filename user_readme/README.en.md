```markdown
# TotalFree RPGLE Formatter

The TotalFree RPGLE Formatter is a small Visual Studio Code extension designed for RPG free-format developers. It automatically indents all lines except the first by a configurable number of spaces (default: 6) when you run "Format Document".

Why use it?

- Saves time by avoiding manual indentation for every line
- Keeps source files compatible with green-screen editors and compilers on IBM i
- Ensures consistent formatting across team members

Important notes:

- The first line must remain at column 1 and contain the `**FREE` marker. Note: some green-screen viewers truncate displayed lines and you may only see the final character (`E`) of the marker, but the token still must be at column 1 or compilation will fail.
- Start coding at column 1 (do not add manual leading spaces). Run the formatter when you're done to apply the indentation.

Usage

1. Install the extension (from VSIX or marketplace when published)
2. Open a RPG free-format source file
3. Run `Format Document` (`Shift+Alt+F` on Windows/Linux, `Shift+Option+F` on macOS) or select `Format Document With...` and choose **TotalFree RPGLE Formatter**

Behavior

- `**FREE` remains at column 1
- All subsequent lines are prefixed with the configured number of spaces (default: 6)
- Files already formatted are left unchanged

If you'd like a German version or other translations kept in the repo, I can preserve `user_readme/README.md` as the German copy.

```