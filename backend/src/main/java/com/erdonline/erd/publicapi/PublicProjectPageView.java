package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class PublicProjectPageView {
    List<PublicProjectSummaryView> items;
    long total;
    long page;
    long size;
}
