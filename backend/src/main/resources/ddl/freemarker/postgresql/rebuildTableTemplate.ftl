CREATE TABLE ERD_UP_${oldEntity.title} AS SELECT * FROM ${oldEntity.title};${separator}

DROP TABLE ${oldEntity.title};${separator}

CREATE TABLE ${newEntity.title}(
<#list newEntity.fields as field>
    `${field.name}` ${field.dataType}<#if field.defaultValue?has_content> DEFAULT ${field.defaultValue}</#if><#if field.notNull> NOT NULL</#if><#if field?has_next || (newPkFieldNames?size > 0)>,</#if>
</#list>
<#if newPkFieldNames?size gt 0>
    PRIMARY KEY (<#list newPkFieldNames as pkName>`${pkName}`<#if pkName?has_next>,</#if></#list>)
</#if>
);${separator}
<#if newEntity.chnname?has_content || newEntity.remark?has_content>
COMMENT ON TABLE ${newEntity.title} IS <#if newEntity.remark?has_content>'${newEntity.remark}'<#else>'${newEntity.chnname}'</#if>;${separator}
</#if>
<#list newEntity.fields as field>
<#if field.chnname?has_content || field.remark?has_content>
COMMENT ON COLUMN ${newEntity.title}.`${field.name}` IS <#if field.remark?has_content>'${field.remark}'<#else>'${field.chnname}'</#if>;${separator}
</#if>
</#list>
INSERT INTO ${newEntity.title}(
<#list sameCols as field>
    `${field.name}`<#if field?has_next>,</#if>
</#list>
)
SELECT
<#list sameCols as field>
    `${field.name}`<#if field?has_next>,</#if>
</#list>
FROM ERD_UP_${oldEntity.title};${separator}

DROP TABLE ERD_UP_${oldEntity.title};${separator}
<#list newEntity.indexs![] as index>
CREATE<#if index.isUnique> UNIQUE</#if> INDEX ${index.name} ON ${newEntity.title}(${erdJoin(index.fields, ",")})<#if index.filter?has_content> WHERE ${index.filter}</#if>;${separator}
</#list>

