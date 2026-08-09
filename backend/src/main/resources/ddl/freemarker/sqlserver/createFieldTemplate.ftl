ALTER TABLE [${entity.title}] ADD [${field.name}] ${field.dataType}<#if field.notNull> NOT NULL</#if><#if field.defaultValue?has_content> DEFAULT ${field.defaultValue}</#if>;${separator}
<#if field.chnname?has_content || field.remark?has_content>
EXEC sp_addextendedproperty @name=N'MS_Description', @value=N'${erdJoin(field.chnname, field.remark, " ")}', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'${entity.title}', @level2type=N'COLUMN', @level2name=N'${field.name}';${separator}
</#if>
