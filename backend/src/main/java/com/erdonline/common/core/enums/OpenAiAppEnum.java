package com.erdonline.common.core.enums;

import com.erdonline.common.core.constant.OpenaiConstants;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Arrays;
import java.util.List;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/4/15 17:40
 * @describtion: OpenAiApplicationEnum
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public enum OpenAiAppEnum {
    // https://platform.openai.com/examples/default-sql-translate
    SQL_TRANSLATE_PROMPT("SQL_TRANSLATE_PROMPT", "Translate natural language to SQL queries", "gpt-3.5-turbo", "将以下自然语言描述转换为SQL查询或操作，只需要返回sql，不要任何解释:\n### {} SQL tables, 表字段信息如下:\n#\n{}\n#\n### {}", 0.0, 1000, 1.0, 1, 0.0, 0.0, Arrays.asList(OpenaiConstants.USER_STOP_FLAG, OpenaiConstants.AI_STOP_FLAG)),
    // https://platform.openai.com/examples/default-sql-request
    SQL_TRANSLATE_FREE("SQL_TRANSLATE_FREE", "Create simple SQL queries", "gpt-3.5-turbo", "{}\n禁止返回涉黄、涉政、涉爆、涉恐、以及中国政要领导人相关的信息", 0.3, 1000, 1.0, 1, 0.0, 0.0, Arrays.asList(OpenaiConstants.USER_STOP_FLAG, OpenaiConstants.AI_STOP_FLAG)),
    SQL_TRANSLATE_PROMPT_ONLY_SQL("SQL_TRANSLATE_PROMPT_ONLY_SQL", "Translate natural language to SQL queries", "gpt-3.5-turbo", "将以下自然语言描述转换为SQL查询或操作，只需要返回sql，不要任何解释：{}\nSchema:{}", 0.3, 2048, 1.0, 1,  0.0,  0.0, Arrays.asList(OpenaiConstants.USER_STOP_FLAG, OpenaiConstants.AI_STOP_FLAG)),
    ;

    String name;
    String desc;
    String model;
    String prompt;
    Double temperature;
    Integer maxTokens;
    Double topP;
    Integer n = 1;
    Double frequencyPenalty;
    Double presencePenalty;
    List stop;

}
