CREATE TABLE [${entity.title}](
<#list entity.fields as field>
    [${field.name}] ${field.dataType}<#if field.notNull> NOT NULL</#if><#if field.autoIncrement> IDENTITY(1,1)</#if><#if field.defaultValue?has_content && !field.autoIncrement> DEFAULT ${field.defaultValue}</#if><#if field?has_next || (pkFieldNames?size > 0)>,</#if>
</#list>
<#if pkFieldNames?size gt 0>
    CONSTRAINT PK_${entity.title} PRIMARY KEY (<#list pkFieldNames as pkName>[${pkName}]<#if pkName?has_next>,</#if></#list>)
</#if>
);${separator}
<#if entity.chnname?has_content || entity.remark?has_content>
EXEC sp_addextendedproperty @name=N'MS_Description', @value=N'${erdJoin(entity.chnname, entity.remark, " ")}', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'${entity.title}';${separator}
</#if>
<#list entity.fields as field>
<#if field.chnname?has_content || field.remark?has_content>
EXEC sp_addextendedproperty @name=N'MS_Description', @value=N'${erdJoin(field.chnname, field.remark, " ")}', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'${entity.title}', @level2type=N'COLUMN', @level2name=N'${field.name}';${separator}
</#if>
</#list>
