package com.erdonline.erd.plaza.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.erd.plaza.common.PageResult;
import com.erdonline.erd.plaza.vo.request.MaterialQueryRequest;
import com.erdonline.erd.plaza.vo.response.MaterialVO;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.erdonline.erd.plaza.entity.Material;
import com.erdonline.erd.plaza.service.MaterialService;
import io.swagger.annotations.ApiParam;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.Map;


/**
 * 素材表接口
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping
public class MaterialController{

    @Autowired
    private MaterialService materialService;

    @ApiOperation(value = "素材表", nickname = "create", notes = "新增素材表", tags = {"material",})
    @RequestMapping(value = "/material", method = RequestMethod.POST)
    @MartinLog("添加素材表")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody Material material) {
        return R.ok(materialService.save(material));
    }

    @ApiOperation(value = "素材表", nickname = "delete", notes = "删除素材表", tags = {"material",})
    @RequestMapping(value = "/material/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除素材表")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialService.removeById(id));
    }

    @ApiOperation(value = "素材表", nickname = "list", notes = "分页查询素材表", tags = {"material",})
    @RequestMapping(value = "/material", method = RequestMethod.GET)
    @MartinLog("分页查询素材表")
    @SneakyThrows
    public R list(@RequestParam Map<String,Object> map) {
        return R.ok(materialService.getPage(map));
    }

    @ApiOperation(value = "素材表", nickname = "multipleDelete", notes = "批量删除素材表", tags = {"material",})
    @RequestMapping(value = "/material/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除素材表")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete material) {
        return R.ok(materialService.removeByIds(material.getKeys()));
    }

    @ApiOperation(value = "素材表", nickname = "partialUpdate", notes = "编辑素材表", tags = {"material",})
    @RequestMapping(value = "/material/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑素材表")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id, @ApiParam(value = "", required = true) @Valid @RequestBody Material material) {
        return R.ok(materialService.updateById(material));
    }

    @ApiOperation(value = "素材表", nickname = "read", notes = "获取单个素材表", tags = {"material",})
    @RequestMapping(value = "/material/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个素材表")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialService.getById(id));
    }

    @ApiOperation(value = "素材表", nickname = "tree", notes = "获取素材表树", tags = {"material",})
    @RequestMapping(value = "/material/tree", method = RequestMethod.GET)
    @MartinLog("获取素材表树")
    public R tree(@ApiParam(value = "", required = true) Material material) {
        return R.ok(materialService.tree(material));
    }

    @ApiOperation(value = "素材表", nickname = "update", notes = "修改素材表", tags = {"material",})
    @RequestMapping(value = "/material/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑素材表")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id")  String id,  @ApiParam(value = "", required = true) @Valid @RequestBody  Material material) {
        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Material::getId, id);
        return R.ok(materialService.update(material,wrapper));
    }

    @GetMapping
    public R<PageResult<MaterialVO>> queryMaterials(MaterialQueryRequest request) {
        return R.ok(materialService.queryMaterials(request));
    }

    @GetMapping("/{id}")
    public R<MaterialVO> getMaterialDetail(@PathVariable String id) {
        return R.ok(materialService.getMaterialDetail(id));
    }

    @PostMapping("/{id}/like")
    public R likeMaterial(@PathVariable String id) {
        materialService.likeMaterial(id);
        return R.ok(null);
    }

    @DeleteMapping("/{id}/like")
    public R unlikeMaterial(@PathVariable String id) {
        materialService.unlikeMaterial(id);
        return R.ok(null);
    }

    @PostMapping("/{id}/favorite")
    public R favoriteMaterial(@PathVariable String id) {
        materialService.favoriteMaterial(id);
        return R.ok(null);
    }

    @DeleteMapping("/{id}/favorite")
    public R unfavoriteMaterial(@PathVariable String id) {
        materialService.unFavoriteMaterial(id);
        return R.ok(null);
    }

    @PostMapping("/{id}/download")
    public R downloadMaterial(@PathVariable String id) {
        materialService.downloadMaterial(id);
        return R.ok(null);
    }
}

