CREATE TABLE `${entity.title}`(
<#list entity.fields as field>
    `${field.name}` ${field.dataType}<#if field.defaultValue?has_content> DEFAULT ${field.defaultValue}</#if><#if field.notNull> NOT NULL</#if><#if field?has_next || (pkFieldNames?size > 0)>,</#if>
</#list>
<#if pkFieldNames?size gt 0>
    PRIMARY KEY (<#list pkFieldNames as pkName>`${pkName}`<#if pkName?has_next>,</#if></#list>)
</#if>
);${separator}
<#if entity.chnname?has_content || entity.remark?has_content>
COMMENT ON TABLE `${entity.title}` IS <#if entity.remark?has_content>'${entity.remark}'<#else>'${entity.chnname}'</#if>;${separator}
</#if>
<#list entity.fields as field>
<#if field.chnname?has_content || field.remark?has_content>
COMMENT ON COLUMN `${entity.title}`.`${field.name}` IS <#if field.remark?has_content>'${field.remark}'<#else>'${field.chnname}'</#if>;${separator}
</#if>
</#list>
