package com.erdonline.erd.security;

import com.erdonline.common.core.exception.ValidateException;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.DescribeStatement;
import net.sf.jsqlparser.statement.ExplainStatement;
import net.sf.jsqlparser.statement.ShowColumnsStatement;
import net.sf.jsqlparser.statement.ShowStatement;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.Statements;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.statement.show.ShowIndexStatement;
import net.sf.jsqlparser.statement.show.ShowTablesStatement;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Online SQL gates: read-only whitelist for query paths; privilege/exfil deny for mutate paths.
 */
public final class SqlGuard {

    private static final Pattern TRAILING_SEMICOLONS = Pattern.compile(";+\\s*$");
    private static final Pattern MULTI_STATEMENT = Pattern.compile(";\\s*\\S");
    /** Privilege escalation / filesystem exfil — denied even on mutate (sync) APIs. */
    private static final Pattern DANGEROUS_ADMIN = Pattern.compile(
            "(?is).*\\b(GRANT|REVOKE|CREATE\\s+USER|DROP\\s+USER|ALTER\\s+USER|SET\\s+PASSWORD|"
                    + "CREATE\\s+ROLE|DROP\\s+ROLE|ALTER\\s+ROLE|"
                    + "INTO\\s+(OUTFILE|DUMPFILE)|LOAD_FILE\\s*\\(|LOAD\\s+DATA\\s+LOCAL)\\b.*");

    private SqlGuard() {
    }

    /**
     * For {@code queryInfo/exec|explain}: single SELECT / EXPLAIN / SHOW / DESC only.
     *
     * @return trimmed SQL without trailing semicolons
     */
    public static String assertReadOnly(String sql) {
        String cleaned = normalizeSingle(sql);
        rejectDangerousAdmin(cleaned);
        try {
            Statements statements = CCJSqlParserUtil.parseStatements(cleaned);
            if (statements == null || statements.getStatements() == null || statements.getStatements().isEmpty()) {
                throw new ValidateException("SQL 为空或无法解析");
            }
            if (statements.getStatements().size() != 1) {
                throw new ValidateException("只读查询禁止多语句");
            }
            Statement stmt = statements.getStatements().get(0);
            if (!isReadOnlyStatement(stmt)) {
                throw new ValidateException("只读查询仅允许 SELECT / EXPLAIN / SHOW / DESC");
            }
        } catch (JSQLParserException e) {
            if (!leadingKeywordIsReadOnly(cleaned)) {
                throw new ValidateException("SQL 无法解析或不在只读白名单内");
            }
        }
        return cleaned;
    }

    /**
     * For connector {@code sqlexec}/{@code dbsync}: allow DDL/DML needed by sync, block admin/exfil.
     */
    public static void assertMutateAllowed(String sql) {
        if (sql == null || sql.isBlank()) {
            return;
        }
        rejectDangerousAdmin(sql.trim());
    }

    public static void assertMutateAllowed(String[] sqls) {
        if (sqls == null) {
            return;
        }
        for (String s : sqls) {
            assertMutateAllowed(s);
        }
    }

    private static String normalizeSingle(String sql) {
        if (sql == null || sql.isBlank()) {
            throw new ValidateException("SQL 不能为空");
        }
        String cleaned = TRAILING_SEMICOLONS.matcher(sql.trim()).replaceAll("").trim();
        if (cleaned.isEmpty()) {
            throw new ValidateException("SQL 不能为空");
        }
        if (MULTI_STATEMENT.matcher(cleaned).find()) {
            throw new ValidateException("只读查询禁止多语句");
        }
        return cleaned;
    }

    private static void rejectDangerousAdmin(String sql) {
        if (DANGEROUS_ADMIN.matcher(sql).matches()) {
            throw new ValidateException("禁止执行权限变更或导出类 SQL");
        }
    }

    private static boolean isReadOnlyStatement(Statement stmt) {
        return stmt instanceof Select
                || stmt instanceof ExplainStatement
                || stmt instanceof ShowStatement
                || stmt instanceof ShowTablesStatement
                || stmt instanceof ShowColumnsStatement
                || stmt instanceof ShowIndexStatement
                || stmt instanceof DescribeStatement;
    }

    private static boolean leadingKeywordIsReadOnly(String sql) {
        String upper = sql.toUpperCase(Locale.ROOT);
        return upper.startsWith("SELECT")
                || upper.startsWith("WITH")
                || upper.startsWith("EXPLAIN")
                || upper.startsWith("SHOW")
                || upper.startsWith("DESC")
                || upper.startsWith("DESCRIBE");
    }
}
