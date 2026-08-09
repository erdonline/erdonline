package com.erdonline.erd.security.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标注在 Controller 方法上：交由 {@code ProjectAccessAspect} 在方法体执行前统一完成
 * 「项目成员 + db_key 归属」校验，方法体本身不再需要手写 assertMember/dbKey 判断。
 *
 * <p>用法：搭配参数级 {@link ProjectId}（必须）与可选的 {@link DbKey} 标注告诉切面去哪个
 * 方法参数取值——参数可以是 {@code String}（路径变量/查询参数）、{@code Map}（请求体）、
 * 或任意实体/DTO（反射调用对应 getter）。未标注 {@link DbKey} 的方法只做成员校验；
 * 标注了则额外校验 db_key 存在性 + 归属（快照哨兵或调用者名下的 {@code data_sources.id}，
 * 否则 403，fail-closed，不做静默改写）。</p>
 *
 * <pre>{@code
 * @RequireProjectAccess
 * @PostMapping("/hisProject/save")
 * public R save(@ProjectId @DbKey @RequestBody DbChange dbChange) { ... }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireProjectAccess {
}
