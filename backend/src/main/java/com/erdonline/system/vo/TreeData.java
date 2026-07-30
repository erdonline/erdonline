package com.erdonline.system.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/8/28
 * @describtion TreeData
 * @since 1.0
 */
@Data
public class TreeData implements Serializable {
    private static final long serialVersionUID = -327148916437922486L;
    private String title;
    private String key;
    private boolean disable;
    private List<TreeData> children;
}
