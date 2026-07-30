package com.erdonline.common.oss.service.impl;

import com.erdonline.common.oss.enums.OssPolicy;
import com.erdonline.common.oss.service.OssTemplate;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.model.GetObjectRequest;
import com.qcloud.cos.model.ObjectMetadata;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
 * @describtion TencentOssTemplate
 * @since 1.0
 */
@Slf4j
@Service("tencentOssTemplate")
@ConditionalOnProperty(name = "martin.oss.tencent.secretId")
public class TencentOssTemplate implements OssTemplate {

    @Autowired
    private COSClient cosClient;

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
        log.info("bucketName: {},fileName: {}", bucketName, fileName);

        return null;
    }

    @Override
    public void download(String bucket, String fileName, String outPath) {
        log.info("bucket: {},fileName: {},outPath: {}", bucket, fileName, outPath);
        GetObjectRequest getObjectRequest = new GetObjectRequest(bucket, fileName);
        File downFile = new File(outPath);
        getObjectRequest = new GetObjectRequest(bucket, fileName);
        ObjectMetadata downObjectMeta = cosClient.getObject(getObjectRequest, downFile);
        log.info("下载成功: {}", downObjectMeta);
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
