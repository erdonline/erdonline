package com.erdonline.common.data.dynamic.datasource;

import lombok.Data;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 13:01
 * @describtion: DbInfo
 */
@Data
public class DbInfo {
    private String dbName;
    private String ip;
    private String port;
    private String url;
    private String driveClassName;
    private String username;
    private String password;
}
