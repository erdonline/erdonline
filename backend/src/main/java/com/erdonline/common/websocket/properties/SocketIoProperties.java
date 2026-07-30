package com.erdonline.common.websocket.properties;

import lombok.Data;
import lombok.ToString;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/15
 * @describtion SocketIoProperties
 * @since 1.0
 */
@Data
@ToString
@ConfigurationProperties("martin.socketio")
public class SocketIoProperties {

    /**
     * =========官方提供的配置属性 begin=========
     */
    private String context = "/socket.io";
    private int bossThreads;
    private int workerThreads;
    private boolean useLinuxNativeEpoll;
    private boolean allowCustomRequests;
    private int upgradeTimeout;
    private int pingTimeout;
    private int pingInterval;
    private int firstDataTimeout;
    private int maxHttpContentLength;
    private int maxFramePayloadLength;
    private String packagePrefix;
    private String hostname;
    private int port;
    private String sslProtocol;
    private String keyStoreFormat;
    private String keyStorePassword;
    private String trustStoreFormat;
    private String trustStorePassword;
    private String origin;
    private boolean preferDirectBuffer;
    private boolean addVersionHeader;
    private boolean httpCompression;
    private boolean websocketCompression;
    private boolean randomSession;
    /**
     *  =========官方提供的配置属性 end=========
     */

    /**
     * =========自定义的属性 begin=========
     */
    private boolean enabled;

    /**
     * SSL证书位置
     */
    private String keyStore;

    /**
     * 重连次数，不能无线重连
     */
    private int retryCount;
    /**
     * =========自定义的属性 end=========
     */

}
