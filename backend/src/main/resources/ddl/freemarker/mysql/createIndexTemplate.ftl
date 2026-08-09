ALTER TABLE `${entity.title}` ADD<#if index.isUnique> UNIQUE</#if> INDEX `${index.name}`(${erdJoin(index.fields, ",")});${separator}
