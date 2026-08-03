package com.erdonline.common.websocket;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import cn.hutool.core.convert.Convert;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketConfig;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.store.RedissonStoreFactory;
import com.corundumstudio.socketio.store.pubsub.PubSubStore;
import com.erdonline.common.core.constant.WebsocketConstants;
import com.erdonline.common.websocket.properties.SocketIoProperties;
import com.erdonline.common.websocket.socketio.SocketIoService;
import com.erdonline.common.websocket.socketio.listener.SocketIoAuthorizationListener;
import com.erdonline.common.websocket.socketio.listener.SocketIoConnectListener;
import com.erdonline.common.websocket.socketio.listener.SocketIoDataListener;
import com.erdonline.common.websocket.socketio.listener.SocketIoDisconnectListener;
import com.erdonline.common.websocket.socketio.listener.SocketIoExceptionListener;
import com.erdonline.config.CrossOriginPolicy;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.redisson.spring.starter.RedissonAutoConfiguration;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.ServiceLoader;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/5/18
 * @describtion MartinSocketIoAutoConfiguration
 * @since 1.0
 */
@Slf4j
@Configuration
@AllArgsConstructor
@ConditionalOnWebApplication
@EnableConfigurationProperties({SocketIoProperties.class})
@ConditionalOnProperty(
        prefix = "martin.socketio",
        name = {"enabled"},
        havingValue = "true",
        matchIfMissing = true
)
@ComponentScan(basePackages = {"com.erdonline.common.websocket", "com.erdonline.common.core"})
@EnableAsync(proxyTargetClass = true)
public class MartinSocketIoAutoConfiguration implements InitializingBean {
    @Autowired
    private SocketIoProperties socketIoProperties;

//    @Autowired
//    private SocketIoConnectListener socketIoConnectListener;

    @Autowired
    private SocketIoAuthorizationListener socketIoAuthorizationListener;

    @Autowired
    private SocketIoDataListener socketIoDataListener;


    @Autowired
    private SocketIoExceptionListener socketIoExceptionListener;

    @Autowired
    private SocketIoConnectListener socketIoConnectListener;

//    @Autowired
//    private SocketIoDisconnectListener socketIoDisconnectListener;

    /**
     * @see RedissonAutoConfiguration#redisson()
     */
    @Autowired
    private RedissonClient redisson;

    @Autowired
    private Environment environment;

    /**
     * 注册一个SocketIOServer，供客户端使用。
     * destroyMethod="stop"：上下文关闭时必须释放 9092 端口，
     * 否则 devtools 热重启/优雅停机后端口泄漏，下次启动 BindException
     *
     * @return
     */
    @Bean(destroyMethod = "stop")
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = configuration();
        SocketIOServer socketIOServer = new SocketIOServer(config);
        ServiceLoader<SocketIoService> load = ServiceLoader.load(SocketIoService.class);
        Iterator<SocketIoService> iterator = load.iterator();
        while (iterator.hasNext()) {
            SocketIoService socketIoService = iterator.next();
            String namespace = socketIoService.getNamespace();
            log.info("namespace=={}", namespace);
            //所有实现必须加到自己的空间下
            Assert.notBlank(namespace);
            //有自动去重功能，重复的空间会加到第一个下
            SocketIONamespace socketIONamespace = socketIOServer.addNamespace(namespace);
            socketIOServer = socketIoService.setNamespaceEvent(socketIONamespace, socketIOServer);
            socketIOServer = socketIoService.setEvent(socketIOServer);
            socketIOServer = socketIoService.setBinaryEvent(socketIOServer);
        }

        socketIOServer.addConnectListener(socketIoConnectListener);
//        socketIOServer.addDisconnectListener(socketIoDisconnectListener);
        final SocketIOServer finalSocketIOServer = socketIOServer;
        //将错误提示注册为全局事件
        finalSocketIOServer.addEventListener(WebsocketConstants.EVENT_ERROR, Object.class, new DataListener<Object>() {
            @Override
            public void onData(SocketIOClient client, Object data, AckRequest ackRequest) {
                // broadcast messages to all clients
                finalSocketIOServer.getBroadcastOperations().sendEvent(WebsocketConstants.EVENT_ERROR, data);
            }
        });
        return finalSocketIOServer;
    }


    @Bean
    public PubSubStore pubSubStore(SocketIOServer socketServer) {
        return socketServer.getConfiguration().getStoreFactory().pubSubStore();
    }

    /**
     * 自定义 socketio 配置
     *
     * @return
     */
    private com.corundumstudio.socketio.Configuration configuration() {
        SocketConfig socketConfig = new SocketConfig();
        socketConfig.setTcpNoDelay(true);
        socketConfig.setSoLinger(0);
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setSocketConfig(socketConfig);
        config.setAuthorizationListener(socketIoAuthorizationListener);
        config.setExceptionListener(socketIoExceptionListener);
        Assert.notNull(redisson);
        config.setStoreFactory(new RedissonStoreFactory(redisson));
        String keyStore = socketIoProperties.getKeyStore();
        if (StrUtil.isNotBlank(keyStore)) {
            log.info("keyStore:{}", keyStore);
            config.setKeyStore(FileUtil.getInputStream(keyStore));
        }
        // R-CFG-04：prod 拒 blank / *；非 prod 可保留 * 便利本地双主机名
        CrossOriginPolicy.assertSocketIoOriginSafeForProfile(socketIoProperties.getOrigin(), environment);
        CopyOptions copyOptions = CopyOptions.create().setIgnoreNullValue(true).setIgnoreCase(false);
        log.info("socketIoProperties:{}", socketIoProperties);
        BeanUtil.copyProperties(socketIoProperties, config, copyOptions);
        log.info("config:{}", Convert.toStr(config));
        return config;
    }


    /**
     * 启动一个 socketio 实例
     *
     * @throws Exception
     */
    @Override
    public void afterPropertiesSet() throws Exception {
        log.info("开始启动 socketio 实例");
        socketIOServer().start();
        log.info("启动 socketio 成功");
    }
}
