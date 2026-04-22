import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import type { CcResourceItem } from "@/lib/admin/resource-reader";

interface CcResourceDetailProps {
  item: CcResourceItem;
  parentItem?: CcResourceItem;
}

function FileExistsBadge({ exists, path }: { exists: boolean; path: string }) {
  return (
    <div className="flex items-center gap-2">
      {exists ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="size-4 shrink-0 text-destructive" />
      )}
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{path}</code>
      {!exists && <span className="text-xs text-destructive">파일 없음</span>}
    </div>
  );
}

function OutputPreview({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  const preview = text.split("\n").slice(0, 7).join("\n");
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <pre className="overflow-x-auto rounded border bg-muted/50 p-2 text-xs leading-relaxed">
        {preview}
        {text.split("\n").length > 7 && "\n..."}
      </pre>
    </div>
  );
}

export function CcResourceDetail({ item, parentItem }: CcResourceDetailProps) {
  const isAlias = !!item.aliasOf;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{item.cc}</h2>
          {isAlias && (
            <Badge variant="outline" className="text-xs">
              별칭
            </Badge>
          )}
        </div>

        {isAlias && (
          <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <ArrowRight className="size-4 shrink-0" />
            <span>
              <strong>{item.aliasOf}</strong>의 별칭입니다. 가이드라인과
              상용구는 <strong>{item.aliasOf}</strong>의 것을 사용합니다.
            </span>
          </div>
        )}

        {!isAlias && item.aliasedBy.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              이 C.C.의 별칭:
            </span>
            {item.aliasedBy.map((alias) => (
              <Badge key={alias} variant="secondary" className="text-xs">
                {alias}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* 가이드라인 섹션 */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">가이드라인</h3>
        {isAlias ? (
          parentItem && parentItem.guideKeys.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {item.aliasOf}의 가이드라인 사용
              </p>
              {parentItem.guides.map((g) => (
                <FileExistsBadge
                  key={g.key}
                  exists={g.exists}
                  path={`ai-docs/cc/${g.key}/guide.md`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {item.aliasOf}에 연결된 가이드라인이 없습니다.
            </p>
          )
        ) : item.guideKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            연결된 가이드라인이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {item.guides.map((g) => (
              <FileExistsBadge
                key={g.key}
                exists={g.exists}
                path={`ai-docs/cc/${g.key}/guide.md`}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* 상용구 섹션 */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">상용구</h3>
        {(() => {
          const templates = isAlias
            ? (parentItem?.templates ?? [])
            : item.templates;
          const keys = isAlias
            ? (parentItem?.templateKeys ?? [])
            : item.templateKeys;

          if (keys.length === 0) {
            return (
              <p className="text-sm text-muted-foreground">
                {isAlias
                  ? `${item.aliasOf}에 연결된 상용구가 없습니다.`
                  : "연결된 상용구가 없습니다."}
              </p>
            );
          }

          return (
            <div className="space-y-4">
              {isAlias && (
                <p className="text-xs text-muted-foreground">
                  {item.aliasOf}의 상용구 사용
                </p>
              )}
              {templates.map((t) => (
                <Card key={t.key} className="overflow-hidden">
                  <CardHeader className="px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FileExistsBadge
                        exists={t.exists}
                        path={`ai-docs/cc/${t.key}/template.json`}
                      />
                    </CardTitle>
                  </CardHeader>
                  {t.exists && (
                    <CardContent className="grid gap-3 px-4 pb-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <p className="text-xs font-medium">
                          P.I 상용구{" "}
                          <span className="text-muted-foreground">
                            (fields)
                          </span>
                        </p>
                        <OutputPreview label="" text={t.mainOutputExample} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium">
                          History{" "}
                          <span className="text-muted-foreground">
                            ({t.historyFieldCount}개 항목)
                          </span>
                        </p>
                        <OutputPreview label="" text={t.historyOutputExample} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium">
                          P/E{" "}
                          <span className="text-muted-foreground">
                            ({t.peFieldCount}개 항목)
                          </span>
                        </p>
                        <OutputPreview label="" text={t.peOutputExample} />
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
