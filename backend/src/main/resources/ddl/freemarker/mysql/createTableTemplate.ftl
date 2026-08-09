CREATE TABLE `${entity.title}`(
<#list entity.fields as field>
    `${field.name}` ${field.dataType}<#if field.notNull> NOT NULL</#if><#if field.autoIncrement> AUTO_INCREMENT</#if><#if field.defaultValue?has_content> DEFAULT ${field.defaultValue}</#if> COMMENT '${erdJoin(field.chnname, field.remark, " ")}'<#if field?has_next || (pkFieldNames?size > 0)>,</#if>
</#list>
<#if pkFieldNames?size gt 0>
    PRIMARY KEY (<#list pkFieldNames as pkName>`${pkName}`<#if pkName?has_next>,</#if></#list>)
</#if>
) COMMENT = '${erdJoin(entity.chnname, entity.remark, " ")}';${separator}
