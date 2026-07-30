package com.erdonline.common.vip.rights;

import cn.hutool.crypto.SecureUtil;
import cn.hutool.crypto.symmetric.SymmetricAlgorithm;
import cn.hutool.crypto.symmetric.SymmetricCrypto;

/**
 * @author 零代科技
 * @version 1.0
 * @date 2023/5/6 17:18
 * @describtion BaseResource
 */
public interface BaseRight<T> {
    String redisKey = "martin:vip:right:{}";
    long timeout = 60 * 60 * 24;
    SymmetricCrypto aes = new SymmetricCrypto(SymmetricAlgorithm.AES, SecureUtil.generateKey(SymmetricAlgorithm.AES.getValue(),"erdonline8888888".getBytes()).getEncoded());


    /**
     * @return T
     * @author 零代科技
     * @date 2023/5/6
     * @description 加载会员权益
     **/
    T load();

    /**
     * @param t
     * @author 零代科技
     * @date 2023/5/6
     * @description 重置权益
     **/
    void reset();

    /**
     * @return boolean
     * @author 零代科技
     * @date 2023/5/6
     * @description 校验会员权益
     *
     * @param reset*/
    boolean valid(boolean reset);

    /**
     * @return boolean
     * @author 零代科技
     * @date 2023/5/6
     * @description 校验会员权益提示信息
     **/
    String msg();
}
