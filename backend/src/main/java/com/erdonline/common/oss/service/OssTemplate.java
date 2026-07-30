package com.erdonline.common.oss.service;

import com.erdonline.common.oss.enums.OssPolicy;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/26
 * @describtion OssTemplate
 * @since 1.0
 */
public interface OssTemplate {
    /**
     * 指定桶、文件名，通过 InputStream 上传
     *
     * @param bucket      桶名
     * @param fileName    文件名
     * @param inputStream
     * @param autoCloseIO 自动关闭input流
     * @return
     * @throws IOException
     */
    String upload(String bucket, String fileName, InputStream inputStream, boolean autoCloseIO) throws IOException;

    /**
     * 指定桶、文件名，通过 File 上传
     *
     * @param bucket      桶名
     * @param fileName    文件名
     * @param file
     * @param autoCloseIO 自动关闭input流
     * @return
     */
    String upload(String bucket, String fileName, File file, boolean autoCloseIO);

    /**
     * 指定桶、文件名，上传指定路径的文件
     * <p>
     * 适合上传服务器内部文件
     *
     * @param bucket      桶名
     * @param fileName    文件名
     * @param filePath    文件路径
     * @param autoCloseIO 自动关闭input流
     * @return
     */
    String upload(String bucket, String fileName, String filePath, boolean autoCloseIO);

    /**
     * 直接通过 MultipartFile 上传
     *
     * @param bucket      桶名
     * @param file        MultipartFile
     * @param autoCloseIO 自动关闭input流
     * @return
     */
    String upload(String bucket, MultipartFile file, boolean autoCloseIO);

    /**
     * 下载文件
     *
     * @param bucket   桶名
     * @param fileName 文件名
     * @return
     */
    InputStream download(String bucket, String fileName);

    /**
     * 下载文件
     *
     * @param bucket   桶名
     * @param fileName 文件名
     * @param outPath 下载路径
     * @return
     */
    void download(String bucket, String fileName,String outPath);

    /**
     * 获取文件的下载地址
     *
     * @param bucket:   桶名
     * @param fileName: 文件名
     * @return: java.lang.String
     */
    String getFileUrl(String bucket, String fileName);

    /**
     * 创建桶
     *
     * @param bucket
     */
    void makeBucket(String bucket);

    /**
     * 更新 bucket 策略
     *
     * @param bucket
     * @param policy
     */
    void setBucketPolicy(String bucket, OssPolicy policy);
}
