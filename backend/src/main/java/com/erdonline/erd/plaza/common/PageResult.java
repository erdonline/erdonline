package com.erdonline.erd.plaza.common;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Data
public class PageResult<T> {
    private Long total;
    private List<T> list;
    
    public static <T, R> PageResult<R> convert(Page<T> page, Function<T, R> converter) {
        PageResult<R> result = new PageResult<>();
        result.setTotal(page.getTotal());
        result.setList(page.getRecords().stream()
                .map(converter)
                .collect(Collectors.toList()));
        return result;
    }
}
