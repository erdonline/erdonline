package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import com.erdonline.common.vip.annotation.VIP;
import com.erdonline.common.vip.enums.VIPLevelEnum;
import com.erdonline.common.vip.enums.VIPModuleEnum;
import com.erdonline.erd.dto.OpenAiSqlDto;
import com.erdonline.erd.service.AIService;
import com.erdonline.erd.vip.rights.AICountRight;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;


/**
 * <p>
 * Chat SQL 控制器
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-04-15
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @ApiOperation(value = "AI生成sql ", nickname = "sql", notes = "AI生成sql ", tags = {"ai",})
    @MartinLog("AI生成sql")
    @RequestMapping(value = "/sql", method = RequestMethod.POST)
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {AICountRight.class}, reset = true)
    public R sql(@ApiParam(value = "", required = true) @Valid @RequestBody OpenAiSqlDto openAiSqlDto) {
        return aiService.sql(openAiSqlDto);
    }

    @ApiOperation(value = "AI生成sql", nickname = "sql", notes = "AI生成sql ", tags = {"ai",})
    @MartinLog("AI生成sql")
    @RequestMapping(value = "/sqlTranslateOrRequest", method = RequestMethod.POST)
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {AICountRight.class}, reset = true)
    public R sqlTranslateOrRequest(@ApiParam(value = "", required = true) @Valid @RequestBody OpenAiSqlDto openAiSqlDto) {
        return aiService.sqlTranslateOrRequest(openAiSqlDto);
    }
}

