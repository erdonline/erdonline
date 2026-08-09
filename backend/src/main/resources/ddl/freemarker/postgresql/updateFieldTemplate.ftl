ALTER TABLE `${entity.title}` ALTER COLUMN `${field.name}` TYPE ${field.dataType};${separator}
<#if field.notNull>ALTER TABLE `${entity.title}` ALTER COLUMN `${field.name}` SET NOT NULL;${separator}</#if>
<#if field.defaultValue?has_content>ALTER TABLE `${entity.title}` ALTER COLUMN `${field.name}` SET DEFAULT ${field.defaultValue};${separator}</#if>
<#if field.chnname?has_content || field.remark?has_content>
COMMENT ON COLUMN `${entity.title}`.`${field.name}` IS <#if field.remark?has_content>'${field.remark}'<#else>'${field.chnname}'</#if>;${separator}
</#if>

