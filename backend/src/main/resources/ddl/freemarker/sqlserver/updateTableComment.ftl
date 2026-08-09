<#if entity.chnname?has_content || entity.remark?has_content>
EXEC sp_updateextendedproperty @name=N'MS_Description', @value=N'${erdJoin(entity.chnname, entity.remark, " ")}', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'${entity.title}';${separator}
</#if>
