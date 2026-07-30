package com.erdonline.erd.codegen.mybatis;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.generator.AutoGenerator;
import com.baomidou.mybatisplus.generator.config.DataSourceConfig;
import com.baomidou.mybatisplus.generator.config.GlobalConfig;
import com.baomidou.mybatisplus.generator.config.PackageConfig;
import com.baomidou.mybatisplus.generator.config.StrategyConfig;
import com.baomidou.mybatisplus.generator.config.TemplateConfig;
import com.baomidou.mybatisplus.generator.config.querys.MySqlQuery;
import com.baomidou.mybatisplus.generator.config.rules.NamingStrategy;
import com.erdonline.erd.entity.Code;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/12/15
 * @describtion 生成controller/service/mapper
 * @since 1.0
 */
@Slf4j
@Component
public class MybatisPlusCodegen {
    public List<File> generateService(Code code, String outputDir) {
        DataSourceConfig dataSourceConfig = new DataSourceConfig.Builder(code.getDbUrl(), code.getDbUsername(), code.getDbPassword())
                .driverClassName(code.getDbDriverName())
                .dbQuery(new MySqlQuery() {
                    /**
                     * 重写父类预留查询自定义字段<br>
                     * 这里查询的 SQL 对应父类 tableFieldsSql 的查询字段，默认不能满足你的需求请重写它<br>
                     * 模板中调用：  table.fields 获取所有字段信息，
                     * 然后循环字段获取 field.customMap 从 MAP 中获取注入字段如下  NULL 或者 PRIVILEGES
                     */
                    @Override
                    public String[] fieldCustom() {
                        return new String[]{"NULL", "PRIVILEGES"};
                    }
                })
                .build();
        // 代码生成器
        AutoGenerator mpg = new AutoGenerator(dataSourceConfig);
        log.info("==生成代码保存路径=={}", outputDir);
        // 全局配置
        setGlobalConfig(outputDir, code, mpg);
        //数据源设置
        setDataSource(mpg, code);
        // 配置模板
        setTemplateConfig(mpg);
        // 策略配置
        setStrategyConfig(code, mpg);
        // 包配置
        PackageConfig pc = setPackageConfig(code, mpg);
        // 自定义配置
        setInjectionConfig(mpg, outputDir, pc, code);
        mpg.execute();

        //删除controller和entity
        //filterControllerAndEntity(outputDir);


        return FileUtil.loopFiles(outputDir);
    }

    private void filterControllerAndEntity(String outputDir) {
        List<File> files = FileUtil.loopFiles(outputDir);
        //过滤掉entity与controller，交给swagger生成，因为有些校验需要swagger控制
        files.stream()
                .forEach(file -> {
                    if (file.getPath().contains(File.separator + "entity") || file.getPath().contains(File.separator + "controller")) {
                        FileUtil.del(file);
                    }
                });
        log.info("==共生成{}个文件=={}",
                files.size(),
                FileUtil.loopFiles(outputDir).stream().map(file -> file.getPath()).collect(Collectors.toList())
        );
    }

    private void setStrategyConfig(Code code, AutoGenerator mpg) {
        // 使用建造者模式配置策略
        StrategyConfig strategyConfig = new StrategyConfig.Builder()
                // 设置需要生成的表
                .addInclude(code.getTableName().split(","))
                // 设置过滤表前缀
                .addTablePrefix(StrUtil.isNotBlank(code.getTablePrefix()) ? code.getTablePrefix() : "")

                // 实体策略配置
                .entityBuilder()
                .naming(NamingStrategy.underline_to_camel)
                .columnNaming(NamingStrategy.underline_to_camel)
                .enableLombok()
                .logicDeleteColumnName("del_flag")
                .superClass("") // 设置父类
                .addSuperEntityColumns("") // 公共字段
                .build()

                // Controller 策略配置
                .controllerBuilder()
                .enableRestStyle()
                .enableHyphenStyle() // 驼峰转连字符
                .superClass("") // 设置父类
                .build();

        mpg.strategy(strategyConfig);
    }

    private void setTemplateConfig(AutoGenerator mpg) {
        TemplateConfig templateConfig = new TemplateConfig.Builder()
                .controller("templates/controller_erd.java")
                .service("templates/service.java")
                .serviceImpl("templates/serviceImpl.java")
                .xml(null)  // 不生成 xml
                //.entity("templates/entity2.java") // 如果需要自定义实体模板
                .build();
        mpg.template(templateConfig);
    }

    private void setInjectionConfig(AutoGenerator mpg, String outputDir, PackageConfig pc, Code code) {
//        // 自定义配置
//        InjectionConfig injectionConfig = new InjectionConfig.Builder()
//                // 注入自定义参数
//                .beforeOutputFile((tableInfo, objectMap) -> {
//                    objectMap.put("moduleName", code.getModuleName());
//                })
//                // 自定义配置 Map 对象
//                .customMap(Collections.singletonMap("moduleName", code.getModuleName()))
//                // 自定义输出文件
//                .customFile(Collections.singletonMap("mapper.xml", "/templates/mapper.xml.vm"))
//                // 自定义文件输出位置
//                .fileOutConfigList(Collections.singletonList(new FileOutConfig("/templates/mapper.xml.vm") {
//                    @Override
//                    public String outputFile(TableInfo tableInfo) {
//                        return outputDir + "/src/main/resources/mapper/"
//                                + pc.getModuleName() + "/"
//                                + tableInfo.getEntityName() + "Mapper"
//                                + StringPool.DOT_XML;
//                    }
//                }))
//                .build();
//
//// 在生成器中使用
//        FastAutoGenerator.create(dataSourceConfig)
//                .injection(injectionConfig)
//                // ... 其他配置
//                .execute();
    }

    private PackageConfig setPackageConfig(Code code, AutoGenerator mpg) {
        // 使用建造者模式配置包信息
        PackageConfig packageConfig = new PackageConfig.Builder()
                .moduleName(code.getModuleName())  // 设置模块名
                .parent(code.getParent())          // 设置父包名
                // 可选的其他配置
                .entity("entity")                  // 实体包名
                .service("service")                // service包名
                .serviceImpl("service.impl")       // serviceImpl包名
                .mapper("mapper")                  // mapper包名
                .xml("mapper.xml")                 // xml包名
                .controller("controller")          // controller包名
                .build();

        mpg.packageInfo(packageConfig);
        return packageConfig;
    }


    private void setDataSource(AutoGenerator mpg, Code code) {
        // 新代码
        DataSourceConfig dataSourceConfig = new DataSourceConfig.Builder(code.getDbUrl(), code.getDbUsername(), code.getDbPassword())
                .driverClassName(code.getDbDriverName())
                .dbQuery(new MySqlQuery() {
                    /**
                     * 重写父类预留查询自定义字段<br>
                     * 这里查询的 SQL 对应父类 tableFieldsSql 的查询字段，默认不能满足你的需求请重写它<br>
                     * 模板中调用：  table.fields 获取所有字段信息，
                     * 然后循环字段获取 field.customMap 从 MAP 中获取注入字段如下  NULL 或者 PRIVILEGES
                     */
                    @Override
                    public String[] fieldCustom() {
                        return new String[]{"NULL", "PRIVILEGES"};
                    }
                })
                .build();

    }

    private void setGlobalConfig(String outputDir, Code code, AutoGenerator mpg) {
        GlobalConfig globalConfig = new GlobalConfig.Builder()
                .outputDir(outputDir + "src/main/java")        // 输出目录
                .author(code.getAuthor())                      // 作者名称
                .enableSwagger()                               // 开启 swagger 模式
                .disableOpenDir()                              // 禁止打开输出目录
                // 自定义文件命名
                .build();
        mpg.global(globalConfig);
    }


}
