package com.erdonline.common.bean.system.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/9/19
 * @describtion 注意，下面的bean每个属性都为必要属性，不可缺一
 * 继承此bean再添加多个属性，不会影响树结构
 * @since 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "树基类")
public class BaseTreeNode {

    private static final long serialVersionUID = 7444637036085561618L;

    @ApiModelProperty(value = "当前节点 id")
    protected String  id;

    @ApiModelProperty(value = "当前节点 id")
    protected String  key;

    @ApiModelProperty(value = "当前节点 title")
    protected String  title;

    @ApiModelProperty(value = "当前节点 label")
    protected String  label;

    @ApiModelProperty(value = "当前节点 value")
    protected String  value;

    @ApiModelProperty(value = "是否是叶子结点")
    protected Boolean  isLeaf;

    @ApiModelProperty(value = "父节点id")
    protected String  parentId;

    @ApiModelProperty(value = "父组件")
    protected String parentKey;

    @ApiModelProperty(value = "父组件集合")
    protected String[] parentKeys;


    /**
     * 名字必须为children，ant design pro  中的子节点都叫children
     */
    @ApiModelProperty(value = "子节点列表")
    protected List<BaseTreeNode> children;

    public void add(BaseTreeNode node) {
        children.add(node);
    }

    public void addChildren(BaseTreeNode node) {
        children.add(node);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
        this.key = id;
        this.value=id;
    }


    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
        this.label = title;
    }

    /**
     * 临时解决is开头的Boolean变量无法复制属性
     * @return
     */
    public Boolean isIsLeaf() {
        return isLeaf;
    }

    public void setLeaf(Boolean leaf) {
        isLeaf = leaf;
    }

}
