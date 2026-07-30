package com.erdonline.common.oss.service.impl;

import com.erdonline.common.oss.enums.OssPolicy;
import com.erdonline.common.oss.service.OssTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/26
 * @describtion QiNiuOssTemplate
 * @since 1.0
 */
@Service("qiNiuOssTemplate")
@ConditionalOnProperty(name = "martin.oss.qiniu.endpoint")
public class QiNiuOssTemplate implements OssTemplate {
    @Override
    public String upload(String bucket, String fileName, InputStream inputStream,boolean autoCloseIO) throws IOException {
        return null;
    }

    @Override
    public String upload(String bucket, String fileName, File file,boolean autoCloseIO) {
        return null;
    }

    @Override
    public String upload(String bucket, String fileName, String filePath,boolean autoCloseIO) {
        return null;
    }

    @Override
    public String upload(String bucket, MultipartFile file,boolean autoCloseIO) {
        return null;
    }

    @Override
    public InputStream download(String bucketName, String fileName) {
        return null;
    }

    @Override
    public void download(String bucket, String fileName, String outPath) {

    }

    @Override
    public String getFileUrl(String bucketName, String fileName) {
        return null;
    }

    @Override
    public void makeBucket(String bucket) {

    }

    @Override
    public void setBucketPolicy(String bucket, OssPolicy policy) {

    }
}
