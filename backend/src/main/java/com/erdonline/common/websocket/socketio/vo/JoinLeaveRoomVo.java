package com.erdonline.common.websocket.socketio.vo;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.io.Serializable;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/25
 * @describtion JoinLeaveRoomVo
 * @since 1.0
 */
@AllArgsConstructor
@Data
public class JoinLeaveRoomVo implements Serializable {
    private String username;
    private Object[] onlineUser;
}
