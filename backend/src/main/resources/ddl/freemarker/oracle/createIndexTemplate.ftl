CREATE<#if index.isUnique> UNIQUE</#if> INDEX `${index.name}` ON `${entity.title}`(${erdJoin(index.fields, ",")});${separator}

