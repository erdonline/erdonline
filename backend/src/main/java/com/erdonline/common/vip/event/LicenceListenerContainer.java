package com.erdonline.common.vip.event;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/13 20:33
 * @describtion: LicenceListenerContainer
 */
@Configuration
public class LicenceListenerContainer {
    @Autowired
    private LicenceInstallListener licenceInstallListener;

    /**
     * 将RedisMessageListenerContainer注册到springbean
     *
     * @param redisConnectionFactory
     * @param adapter
     * @return
     */
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory redisConnectionFactory,
                                                                       MessageListenerAdapter adapter){
        RedisMessageListenerContainer redisMessageListenerContainer = new RedisMessageListenerContainer();
        //配置redis连接信息
        redisMessageListenerContainer.setConnectionFactory(redisConnectionFactory);
        //订阅一个匹配（支持Ant通配符）message-*的通道
        //这里可以添加多个消息监听
        redisMessageListenerContainer.addMessageListener(adapter, new PatternTopic("message-licence-*"));
        return redisMessageListenerContainer;
    }

    /**
     * 消息侦听器适配器，
     * 它通过反射将消息处理委托给目标侦听器方法，具有灵活的消息类型转换。
     * 允许侦听器方法操作消息内容类型，完全独立于Redis API。
     *
     * @return
     */
    @Bean
    public MessageListenerAdapter adapter(){
        //这里的onMessage必须与listener方法名保持一致
        return new MessageListenerAdapter(licenceInstallListener, "onMessage");
    }


}
