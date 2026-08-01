package com.erdonline.common.core.constant;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/22
 * @describtion WebsocketConstants, 保存系统中websocket用到的常量
 * @since 1.0
 */
public final class WebsocketConstants {
    private WebsocketConstants() {
    }

    public static final String SOCKET_IO_CACHE_PREFIX = CommonConstants.MARTIN + ":socketio";

    public static final String INVALID_PARAM = "参数非法";

    public static final String TOKEN = "token";

    /** 短票（见 SocketTicketService），替代超长 JWT query */
    public static final String TICKET = "ticket";

    public static final String USER_NAME = "username";

    /**
     * 项目id字段
     */
    public static final String PROJECT_ID = "projectId";

    /**
     * 用户连接socket之后，在每个socket中用户名的key
     */
    public static final String USERNAME = CommonConstants.MARTIN + ":socketio:username";

    /**
     * 当event报错或者校验不通过，通知前端的事件
     */
    public static final String EVENT_ERROR = CommonConstants.MARTIN + ":event:error";

    /**
     * 发送在线用户数的事件
     */
    public static final String EVENT_ONLINE_USER = CommonConstants.MARTIN + ":user:online";

    /**
     * 用户相关的命名空间
     */
    public static final String USER_NAMESPACE = "/user";

    /**
     * 项目相关的命名空间
     */
    public static final String PROJECT_NAMESPACE = "/project";

    /**
     * 重连次数
     */
    public static final String RETRY_COUNT = "retryCount";


    /**
     * 重连次数
     */
    public static final String OVER_RETRY_COUNT = "超过最大重试次数";

    /**
     * 加入房间
     */
    public static final String JOIN_ROOM = CommonConstants.MARTIN + ":event:joinRoom";

    /**
     * 加入房间提示
     */
    public static final String JOIN_ROOM_TIP = "加入房间";

    /**
     * 离开房间
     */
    public static final String LEAVE_ROOM = CommonConstants.MARTIN + ":event:leaveRoom";

    /**
     * 离开房间提示
     */
    public static final String LEAVE_ROOM_TIP = "离开房间";

    /**
     * 协作光标（flow 坐标 x/y）
     */
    public static final String CURSOR = CommonConstants.MARTIN + ":event:cursor";

    /**
     * 模型增量同步（jsondiffpatch delta，作用域 projectJSON）
     */
    public static final String SYNC = CommonConstants.MARTIN + ":event:sync";

    /**
     * redisson在Spring容器中的Bean名称
     */
    public static final String REDISSON_SPRING_BEAN_NAME = "redisson";
}
