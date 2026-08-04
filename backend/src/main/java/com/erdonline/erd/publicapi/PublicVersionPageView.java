package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class PublicVersionPageView {
    List<PublicVersionSummaryView> items;
    long total;
    long page;
    long size;
}
