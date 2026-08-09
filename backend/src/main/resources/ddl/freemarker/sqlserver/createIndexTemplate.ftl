CREATE<#if index.isUnique> UNIQUE</#if> INDEX [${index.name}] ON [${entity.title}](${erdJoin(index.fields, ",")})<#if index.filter?has_content> WHERE ${index.filter}</#if>;${separator}
