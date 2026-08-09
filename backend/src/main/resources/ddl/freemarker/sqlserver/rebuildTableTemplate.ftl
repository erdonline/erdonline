SELECT * INTO ERD_UP_${oldEntity.title} FROM ${oldEntity.title};${separator}

DROP TABLE ${oldEntity.title};${separator}

CREATE TABLE [${newEntity.title}](
<#list newEntity.fields as field>
    [${field.name}] ${field.dataType}<#if field.defaultValue?has_content> DEFAULT ${field.defaultValue}</#if><#if field.notNull> NOT NULL</#if><#if field?has_next || (newPkFieldNames?size > 0)>,</#if>
</#list>
<#if newPkFieldNames?size gt 0>
    CONSTRAINT PK_${newEntity.title} PRIMARY KEY (<#list newPkFieldNames as pkName>[${pkName}]<#if pkName?has_next>,</#if></#list>)
</#if>
);${separator}
INSERT INTO ${newEntity.title}(
<#list sameCols as field>
    [${field.name}]<#if field?has_next>,</#if>
</#list>
)
SELECT
<#list sameCols as field>
    [${field.name}]<#if field?has_next>,</#if>
</#list>
FROM ERD_UP_${oldEntity.title};${separator}

DROP TABLE ERD_UP_${oldEntity.title};${separator}
<#list newEntity.indexs![] as index>
CREATE<#if index.isUnique> UNIQUE</#if> INDEX [${index.name}] ON [${newEntity.title}](${erdJoin(index.fields, ",")})<#if index.filter?has_content> WHERE ${index.filter}</#if>;${separator}
</#list>
