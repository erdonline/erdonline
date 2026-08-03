package com.erdonline.common.oss.service.impl;

import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.constant.OssConstants;
import com.erdonline.common.oss.enums.OssPolicy;
import com.erdonline.common.oss.service.OssTemplate;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import io.minio.http.Method;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;


/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/26
 * @describtion MinioOssTemplate
 * @since 1.0
 */
@Slf4j
@Service("minioOssTemplate")
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${martin.oss.minio.endpoint:}')")
public class MinioOssTemplate implements OssTemplate {
    @Autowired
    private MinioClient minioClient;

    /**
     * 桶占位符
     */
    private final String BUCKET_PARAM = "${bucket}";
    /**
     * bucket权限-只读
     */
    private final String READ_ONLY = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:GetBucketLocation\",\"s3:ListBucket\"],\"Resource\":[\"arn:aws:s3:::" + BUCKET_PARAM + "\"]},{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::" + BUCKET_PARAM + "/*\"]}]}";
    /**
     * bucket权限-只读
     */
    private final String WRITE_ONLY = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:GetBucketLocation\",\"s3:ListBucketMultipartUploads\"],\"Resource\":[\"arn:aws:s3:::" + BUCKET_PARAM + "\"]},{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:AbortMultipartUpload\",\"s3:DeleteObject\",\"s3:ListMultipartUploadParts\",\"s3:PutObject\"],\"Resource\":[\"arn:aws:s3:::" + BUCKET_PARAM + "/*\"]}]}";
    /**
     * bucket权限-读写
     */
    private final String READ_WRITE = "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:GetBucketLocation\",\"s3:ListBucket\",\"s3:ListBucketMultipartUploads\"],\"Resource\":[\"arn:aws:s3:::" + BUCKET_PARAM + "\"]},{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":[\"*\"]},\"Action\":[\"s3:DeleteObject\",\"s3:GetObject\",\"s3:ListMultipartUploadParts\",\"s3:PutObject\",\"s3:AbortMultipartUpload\"],\"Resource\":[\"arn:aws:s3:::" + BUCKET_PARAM + "/*\"]}]}";


    @Override
    @SneakyThrows(Exception.class)
    public String upload(String bucket, String fileName, InputStream inputStream, boolean autoCloseIO) throws IOException {
        log.info("bucket: {},fileName: {},inputStream: {},autoCloseIO: {}", bucket, fileName, inputStream, autoCloseIO);
        if (StrUtil.isBlank(bucket)) {
            bucket = OssConstants.DEFAULT_BUCKET;
        }
        Assert.notBlank(fileName,"上传的文件名不能为空");
        if (!fileName.contains(StrUtil.DOT)) {
            throw new IllegalArgumentException(StrUtil.format("fileName: {}必须包含文件类型", fileName));
        }
        String fileNamePrefix = "";
        String fileNameSuffix = "";
        if (fileName.contains(StrUtil.SLASH)) {
            //截取最后一个斜杠前面部分
            fileNamePrefix = StrUtil.subBefore(fileName, StrUtil.SLASH, true);
            if (StrUtil.isNotBlank(fileNamePrefix)) {
                fileNamePrefix += StrUtil.SLASH;
            }
            //截取最后一个斜杠后面部分
            fileNameSuffix = StrUtil.subAfter(fileName, StrUtil.SLASH, true);
        } else {
            fileNameSuffix = fileName;
        }
        log.info("fileNamePrefix: {}", fileNamePrefix);
        log.info("fileNameSuffix: {}", fileNameSuffix);
        String minioFilePath = fileNamePrefix + IdUtil.fastSimpleUUID() + StrUtil.DOT + StrUtil.splitToArray(fileNameSuffix, '.')[1];
        log.info("minioFilePath: {}", minioFilePath);
        try {
            makeBucket(bucket);
            //开始上传
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(minioFilePath)
                    .stream(inputStream, inputStream.available(), -1)
                    .build());
            log.info("{}' 上传成功  ", minioFilePath);
        } finally {
            if (autoCloseIO) {
                if (inputStream != null) {
                    inputStream.close();
                }
            }
        }
        return bucket + StrUtil.SLASH + minioFilePath;
    }

    @Override
    @SneakyThrows(Exception.class)
    public String upload(String bucket, String fileName, File file, boolean autoCloseIO) {
        return upload(bucket, fileName, new FileInputStream(file), autoCloseIO);
    }

    @Override
    public String upload(String bucket, String fileName, String filePath, boolean autoCloseIO) {
        return upload(bucket, fileName, new File(filePath), autoCloseIO);
    }

    @Override
    @SneakyThrows(Exception.class)
    public String upload(String bucket, MultipartFile file, boolean autoCloseIO) {
        log.info("bucket: {},file: {},autoCloseIO: {}", bucket, file, autoCloseIO);
        InputStream inputStream = null;
        String fileName;
        inputStream = file.getInputStream();
        fileName = file.getOriginalFilename();
        return upload(bucket, fileName, inputStream, autoCloseIO);
    }

    @Override
    @SneakyThrows
    public InputStream download(String bucketName, String fileName) {
        log.info("bucketName: {},fileName: {}", bucketName, fileName);
        return minioClient.getObject(GetObjectArgs.builder().bucket(bucketName).object(fileName).build());
    }

    @Override
    public void download(String bucket, String fileName, String outPath) {

    }

    /**
     * 获取minio文件的下载地址
     *
     * @param bucketName: 桶名
     * @param fileName:   文件名
     * @return: java.lang.String
     */
    @Override
    @SneakyThrows(Exception.class)
    public String getFileUrl(String bucketName, String fileName) {
        return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                .bucket(bucketName)
                .object(fileName)
                .method(Method.GET)
                .build());
    }


    @Override
    @SneakyThrows
    public void makeBucket(String bucket) {
        log.info("bucket: {}", bucket);
        //判断bucket是否存在
        boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!found) {
            // 新建 bucket
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            setBucketPolicy(bucket, OssPolicy.READ_WRITE);
            log.info("Bucket '{}' 新建成功", bucket);
        } else {
            log.info("Bucket '{}' 已经存在", bucket);
        }
    }


    /**
     * 更新桶权限策略
     *
     * @param bucket 桶
     * @param policy 权限
     */
    @Override
    @SneakyThrows
    public void setBucketPolicy(String bucket, OssPolicy policy) {
        log.info("bucket: {},policy: {}", bucket, policy);
        switch (policy.type) {
            case 0:
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(READ_ONLY.replace(BUCKET_PARAM, bucket)).build());
                break;
            case 1:
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(WRITE_ONLY.replace(BUCKET_PARAM, bucket)).build());
                break;
            case 2:
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(READ_WRITE.replace(BUCKET_PARAM, bucket)).build());
                break;
            default:
                break;
        }
    }
}
