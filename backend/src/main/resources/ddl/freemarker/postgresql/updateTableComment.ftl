<#if entity.chnname?has_content || entity.remark?has_content>
COMMENT ON TABLE `${entity.title}` IS <#if entity.remark?has_content>'${entity.remark}'<#else>'${entity.chnname}'</#if>;${separator}
</#if>

