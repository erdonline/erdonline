package com.erdonline.common.bean.system;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModelProperty;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * MultiDelete
 */
@Validated
@jakarta.annotation.Generated(value = "io.swagger.codegen.languages.SpringCodegen", date = "2022-11-22T20:40:48.565+08:00")




public class MultiDelete {
  @JsonProperty("keys")
  @Valid
  private List<Object> keys = null;

  public MultiDelete keys(List<Object> keys) {
    this.keys = keys;
    return this;
  }

  public MultiDelete addKeysItem(Object keysItem) {
    if (this.keys == null) {
      this.keys = new ArrayList<Object>();
    }
    this.keys.add(keysItem);
    return this;
  }

  /**
   * 主键列表
   * @return keys
  **/
  @ApiModelProperty(value = "主键列表")
  public List getKeys() {
    return keys;
  }

  public void setKeys(List<Object> keys) {
    this.keys = keys;
  }


  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    MultiDelete multiDelete = (MultiDelete) o;
    return Objects.equals(this.keys, multiDelete.keys);
  }

  @Override
  public int hashCode() {
    return Objects.hash(keys);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class MultiDelete {\n");
    
    sb.append("    keys: ").append(toIndentedString(keys)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}

