ALTER TABLE `${entity.title}` MODIFY(`${field.name}` ${field.dataType}<#if field.defaultValue?has_content> DEFAULT ${field.defaultValue}</#if><#if field.notNull> NOT NULL</#if>);${separator}
<#if field.chnname?has_content || field.remark?has_content>
COMMENT ON COLUMN `${entity.title}`.`${field.name}` IS <#if field.remark?has_content>'${field.remark}'<#else>'${field.chnname}'</#if>;${separator}
</#if>

