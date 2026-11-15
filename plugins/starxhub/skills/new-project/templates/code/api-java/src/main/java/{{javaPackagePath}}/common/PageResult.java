package {{javaPackage}}.common;

import java.io.Serializable;
import java.util.List;

/** 分页出参：与前端 types/index.ts 的 PageResult<T> 字段一一对应。 */
public class PageResult<T> implements Serializable {
    private List<T> items;
    private long total;
    private long page;
    private long pageSize;

    public PageResult() { }

    public PageResult(List<T> items, long total, long page, long pageSize) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
    }

    public List<T> getItems() { return items; }
    public long getTotal() { return total; }
    public long getPage() { return page; }
    public long getPageSize() { return pageSize; }
    public void setItems(List<T> items) { this.items = items; }
    public void setTotal(long total) { this.total = total; }
    public void setPage(long page) { this.page = page; }
    public void setPageSize(long pageSize) { this.pageSize = pageSize; }
}
