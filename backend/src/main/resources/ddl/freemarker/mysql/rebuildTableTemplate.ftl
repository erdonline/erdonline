create table ERD_UP_${oldEntity.title}
as select * from ${oldEntity.title};${separator}

drop table ${oldEntity.title};${separator}

CREATE TABLE ${newEntity.title}(
<#list newEntity.fields as field>
    `${field.name}` ${field.dataType}<#if field.notNull> NOT NULL</#if> COMMENT '${erdJoin(field.chnname, field.remark, ";")}'<#if field?has_next || (newPkFieldNames?size > 0)>,</#if>
</#list>
<#if newPkFieldNames?size gt 0>
    PRIMARY KEY (<#list newPkFieldNames as pkName>`${pkName}`<#if pkName?has_next>,</#if></#list>)
</#if>
) COMMENT = '${erdJoin(newEntity.chnname, newEntity.remark, ";")}';${separator}

insert into ${newEntity.title}(
<#list sameCols as field>
    `${field.name}`<#if field?has_next>,</#if>
</#list>
)
select
<#list sameCols as field>
    `${field.name}`<#if field?has_next>,</#if>
</#list>
from ERD_UP_${oldEntity.title};${separator}

drop table ERD_UP_${oldEntity.title};${separator}
<#list newEntity.indexs![] as index>
ALTER TABLE ${newEntity.title} ADD<#if index.isUnique> UNIQUE<#else> INDEX</#if> ${index.name}(${erdJoin(index.fields, ",")});${separator}
</#list>
