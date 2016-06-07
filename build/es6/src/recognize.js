import { flatten, first, merge } from './utils/collection';
import { TreeNode } from './utils/tree';
import { RouterStateSnapshot, ActivatedRouteSnapshot } from './router_state';
import { PRIMARY_OUTLET } from './shared';
import { Observable } from 'rxjs/Observable';
class CannotRecognize {
}
export function recognize(rootComponentType, config, url) {
    try {
        const match = new MatchResult(rootComponentType, config, [url.root], {}, url._root.children, [], PRIMARY_OUTLET, null, url.root);
        const roots = constructActivatedRoute(match);
        const res = new RouterStateSnapshot(roots[0], url.queryParams, url.fragment);
        return new Observable(obs => {
            obs.next(res);
            obs.complete();
        });
    }
    catch (e) {
        if (e instanceof CannotRecognize) {
            return new Observable(obs => obs.error(new Error("Cannot match any routes")));
        }
        else {
            return new Observable(obs => obs.error(e));
        }
    }
}
function constructActivatedRoute(match) {
    const activatedRoute = createActivatedRouteSnapshot(match);
    const children = match.leftOverUrl.length > 0 ?
        recognizeMany(match.children, match.leftOverUrl) : recognizeLeftOvers(match.children, match.lastUrlSegment);
    checkOutletNameUniqueness(children);
    children.sort((a, b) => {
        if (a.value.outlet === PRIMARY_OUTLET)
            return -1;
        if (b.value.outlet === PRIMARY_OUTLET)
            return 1;
        return a.value.outlet.localeCompare(b.value.outlet);
    });
    return [new TreeNode(activatedRoute, children)];
}
function recognizeLeftOvers(config, lastUrlSegment) {
    if (!config)
        return [];
    const mIndex = matchIndex(config, [], lastUrlSegment);
    return mIndex ? constructActivatedRoute(mIndex) : [];
}
function recognizeMany(config, urls) {
    return flatten(urls.map(url => recognizeOne(config, url)));
}
function createActivatedRouteSnapshot(match) {
    return new ActivatedRouteSnapshot(match.consumedUrlSegments, match.parameters, match.outlet, match.component, match.route, match.lastUrlSegment);
}
function recognizeOne(config, url) {
    const matches = match(config, url);
    for (let match of matches) {
        try {
            const primary = constructActivatedRoute(match);
            const secondary = recognizeMany(config, match.secondary);
            const res = primary.concat(secondary);
            checkOutletNameUniqueness(res);
            return res;
        }
        catch (e) {
            if (!(e instanceof CannotRecognize)) {
                throw e;
            }
        }
    }
    throw new CannotRecognize();
}
function checkOutletNameUniqueness(nodes) {
    let names = {};
    nodes.forEach(n => {
        let routeWithSameOutletName = names[n.value.outlet];
        if (routeWithSameOutletName) {
            const p = routeWithSameOutletName.urlSegments.map(s => s.toString()).join("/");
            const c = n.value.urlSegments.map(s => s.toString()).join("/");
            throw new Error(`Two segments cannot have the same outlet name: '${p}' and '${c}'.`);
        }
        names[n.value.outlet] = n.value;
    });
    return nodes;
}
function match(config, url) {
    const res = [];
    for (let r of config) {
        if (r.index) {
            res.push(createIndexMatch(r, [url], url.value));
        }
        else {
            const m = matchWithParts(r, url);
            if (m)
                res.push(m);
        }
    }
    return res;
}
function createIndexMatch(r, leftOverUrls, lastUrlSegment) {
    const outlet = r.outlet ? r.outlet : PRIMARY_OUTLET;
    const children = r.children ? r.children : [];
    return new MatchResult(r.component, children, [], lastUrlSegment.parameters, leftOverUrls, [], outlet, r, lastUrlSegment);
}
function matchIndex(config, leftOverUrls, lastUrlSegment) {
    for (let r of config) {
        if (r.index) {
            return createIndexMatch(r, leftOverUrls, lastUrlSegment);
        }
    }
    return null;
}
function matchWithParts(route, url) {
    if (!route.path)
        return null;
    if ((route.outlet ? route.outlet : PRIMARY_OUTLET) !== url.value.outlet)
        return null;
    const path = route.path.startsWith("/") ? route.path.substring(1) : route.path;
    if (path === "**") {
        const consumedUrl = [];
        let u = url;
        while (u) {
            consumedUrl.push(u.value);
            u = first(u.children);
        }
        const last = consumedUrl[consumedUrl.length - 1];
        return new MatchResult(route.component, [], consumedUrl, last.parameters, [], [], PRIMARY_OUTLET, route, last);
    }
    const parts = path.split("/");
    const positionalParams = {};
    const consumedUrlSegments = [];
    let lastParent = null;
    let lastSegment = null;
    let current = url;
    for (let i = 0; i < parts.length; ++i) {
        if (!current)
            return null;
        const p = parts[i];
        const isLastSegment = i === parts.length - 1;
        const isLastParent = i === parts.length - 2;
        const isPosParam = p.startsWith(":");
        if (!isPosParam && p != current.value.path)
            return null;
        if (isLastSegment) {
            lastSegment = current;
        }
        if (isLastParent) {
            lastParent = current;
        }
        if (isPosParam) {
            positionalParams[p.substring(1)] = current.value.path;
        }
        consumedUrlSegments.push(current.value);
        current = first(current.children);
    }
    if (!lastSegment)
        throw "Cannot be reached";
    const p = lastSegment.value.parameters;
    const parameters = merge(p, positionalParams);
    const secondarySubtrees = lastParent ? lastParent.children.slice(1) : [];
    const children = route.children ? route.children : [];
    const outlet = route.outlet ? route.outlet : PRIMARY_OUTLET;
    return new MatchResult(route.component, children, consumedUrlSegments, parameters, lastSegment.children, secondarySubtrees, outlet, route, lastSegment.value);
}
class MatchResult {
    constructor(component, children, consumedUrlSegments, parameters, leftOverUrl, secondary, outlet, route, lastUrlSegment) {
        this.component = component;
        this.children = children;
        this.consumedUrlSegments = consumedUrlSegments;
        this.parameters = parameters;
        this.leftOverUrl = leftOverUrl;
        this.secondary = secondary;
        this.outlet = outlet;
        this.route = route;
        this.lastUrlSegment = lastUrlSegment;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb2duaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3JlY29nbml6ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiT0FDTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sb0JBQW9CO09BQ25ELEVBQUUsUUFBUSxFQUFFLE1BQU0sY0FBYztPQUNoQyxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLE1BQU0sZ0JBQWdCO09BQ3JFLEVBQVUsY0FBYyxFQUFFLE1BQU0sVUFBVTtPQUcxQyxFQUFFLFVBQVUsRUFBRSxNQUFNLGlCQUFpQjtBQUU1QztBQUF1QixDQUFDO0FBRXhCLDBCQUEwQixpQkFBdUIsRUFBRSxNQUFvQixFQUFFLEdBQVk7SUFDbkYsSUFBSSxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakksTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0UsTUFBTSxDQUFDLElBQUksVUFBVSxDQUFzQixHQUFHO1lBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZCxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFFO0lBQUEsS0FBSyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztR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QUFNLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRUQ7SUFDRSxZQUFtQixTQUF3QixFQUN4QixRQUFpQixFQUNqQixtQkFBaUMsRUFDakMsVUFBbUMsRUFDbkMsV0FBbUMsRUFDbkMsU0FBaUMsRUFDakMsTUFBYyxFQUNkLEtBQW1CLEVBQ25CLGNBQTBCO1FBUjFCLGNBQVMsR0FBVCxTQUFTLENBQWU7UUFDeEIsYUFBUSxHQUFSLFFBQVEsQ0FBUztRQUNqQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQWM7UUFDakMsZUFBVSxHQUFWLFVBQVUsQ0FBeUI7UUFDbkMsZ0JBQVcsR0FBWCxXQUFXLENBQXdCO1FBQ25DLGNBQVMsR0FBVCxTQUFTLENBQXdCO1FBQ2pDLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDZCxVQUFLLEdBQUwsS0FBSyxDQUFjO1FBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUFZO0lBQzFDLENBQUM7QUFDTixDQUFDO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVcmxUcmVlLCBVcmxTZWdtZW50IH0gZnJvbSAnLi91cmxfdHJlZSc7XG5pbXBvcnQgeyBmbGF0dGVuLCBmaXJzdCwgbWVyZ2UgfSBmcm9tICcuL3V0aWxzL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHsgVHJlZU5vZGUgfSBmcm9tICcuL3V0aWxzL3RyZWUnO1xuaW1wb3J0IHsgUm91dGVyU3RhdGVTbmFwc2hvdCwgQWN0aXZhdGVkUm91dGVTbmFwc2hvdCB9IGZyb20gJy4vcm91dGVyX3N0YXRlJztcbmltcG9ydCB7IFBhcmFtcywgUFJJTUFSWV9PVVRMRVQgfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQgeyBSb3V0ZXJDb25maWcsIFJvdXRlIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgVHlwZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvT2JzZXJ2YWJsZSc7XG5cbmNsYXNzIENhbm5vdFJlY29nbml6ZSB7fVxuXG5leHBvcnQgZnVuY3Rpb24gcmVjb2duaXplKHJvb3RDb21wb25lbnRUeXBlOiBUeXBlLCBjb25maWc6IFJvdXRlckNvbmZpZywgdXJsOiBVcmxUcmVlKTogT2JzZXJ2YWJsZTxSb3V0ZXJTdGF0ZVNuYXBzaG90PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbWF0Y2ggPSBuZXcgTWF0Y2hSZXN1bHQocm9vdENvbXBvbmVudFR5cGUsIGNvbmZpZywgW3VybC5yb290XSwge30sIHVybC5fcm9vdC5jaGlsZHJlbiwgW10sIFBSSU1BUllfT1VUTEVULCBudWxsLCB1cmwucm9vdCk7XG4gICAgY29uc3Qgcm9vdHMgPSBjb25zdHJ1Y3RBY3RpdmF0ZWRSb3V0ZShtYXRjaCk7XG4gICAgY29uc3QgcmVzID0gbmV3IFJvdXRlclN0YXRlU25hcHNob3Qocm9vdHNbMF0sIHVybC5xdWVyeVBhcmFtcywgdXJsLmZyYWdtZW50KTtcbiAgICByZXR1cm4gbmV3IE9ic2VydmFibGU8Um91dGVyU3RhdGVTbmFwc2hvdD4ob2JzID0+IHtcbiAgICAgIG9icy5uZXh0KHJlcyk7XG4gICAgICBvYnMuY29tcGxldGUoKTtcbiAgICB9KTtcbiAgfSBjYXRjaChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBDYW5ub3RSZWNvZ25pemUpIHtcbiAgICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxSb3V0ZXJTdGF0ZVNuYXBzaG90PihvYnMgPT4gb2JzLmVycm9yKG5ldyBFcnJvcihcIkNhbm5vdCBtYXRjaCBhbnkgcm91dGVzXCIpKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgT2JzZXJ2YWJsZTxSb3V0ZXJTdGF0ZVNuYXBzaG90PihvYnMgPT4gb2JzLmVycm9yKGUpKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY29uc3RydWN0QWN0aXZhdGVkUm91dGUobWF0Y2g6IE1hdGNoUmVzdWx0KTogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGVTbmFwc2hvdD5bXSB7XG4gIGNvbnN0IGFjdGl2YXRlZFJvdXRlID0gY3JlYXRlQWN0aXZhdGVkUm91dGVTbmFwc2hvdChtYXRjaCk7XG4gIGNvbnN0IGNoaWxkcmVuID0gbWF0Y2gubGVmdE92ZXJVcmwubGVuZ3RoID4gMCA/XG4gICAgcmVjb2duaXplTWFueShtYXRjaC5jaGlsZHJlbiwgbWF0Y2gubGVmdE92ZXJVcmwpIDogcmVjb2duaXplTGVmdE92ZXJzKG1hdGNoLmNoaWxkcmVuLCBtYXRjaC5sYXN0VXJsU2VnbWVudCk7XG4gIGNoZWNrT3V0bGV0TmFtZVVuaXF1ZW5lc3MoY2hpbGRyZW4pO1xuICBjaGlsZHJlbi5zb3J0KChhLCBiKSA9PiB7XG4gICAgaWYgKGEudmFsdWUub3V0bGV0ID09PSBQUklNQVJZX09VVExFVCkgcmV0dXJuIC0xO1xuICAgIGlmIChiLnZhbHVlLm91dGxldCA9PT0gUFJJTUFSWV9PVVRMRVQpIHJldHVybiAxO1xuICAgIHJldHVybiBhLnZhbHVlLm91dGxldC5sb2NhbGVDb21wYXJlKGIudmFsdWUub3V0bGV0KVxuICB9KTtcbiAgcmV0dXJuIFtuZXcgVHJlZU5vZGU8QWN0aXZhdGVkUm91dGVTbmFwc2hvdD4oYWN0aXZhdGVkUm91dGUsIGNoaWxkcmVuKV07XG59XG5cbmZ1bmN0aW9uIHJlY29nbml6ZUxlZnRPdmVycyhjb25maWc6IFJvdXRlW10sIGxhc3RVcmxTZWdtZW50OiBVcmxTZWdtZW50KTogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGVTbmFwc2hvdD5bXSB7XG4gIGlmICghY29uZmlnKSByZXR1cm4gW107XG4gIGNvbnN0IG1JbmRleCA9IG1hdGNoSW5kZXgoY29uZmlnLCBbXSwgbGFzdFVybFNlZ21lbnQpO1xuICByZXR1cm4gbUluZGV4ID8gY29uc3RydWN0QWN0aXZhdGVkUm91dGUobUluZGV4KSA6IFtdO1xufVxuXG5mdW5jdGlvbiByZWNvZ25pemVNYW55KGNvbmZpZzogUm91dGVbXSwgdXJsczogVHJlZU5vZGU8VXJsU2VnbWVudD5bXSk6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlU25hcHNob3Q+W10ge1xuICByZXR1cm4gZmxhdHRlbih1cmxzLm1hcCh1cmwgPT4gcmVjb2duaXplT25lKGNvbmZpZywgdXJsKSkpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KG1hdGNoOiBNYXRjaFJlc3VsdCk6IEFjdGl2YXRlZFJvdXRlU25hcHNob3Qge1xuICByZXR1cm4gbmV3IEFjdGl2YXRlZFJvdXRlU25hcHNob3QobWF0Y2guY29uc3VtZWRVcmxTZWdtZW50cywgbWF0Y2gucGFyYW1ldGVycywgbWF0Y2gub3V0bGV0LCBtYXRjaC5jb21wb25lbnQsIG1hdGNoLnJvdXRlLCBtYXRjaC5sYXN0VXJsU2VnbWVudCk7XG59XG5cbmZ1bmN0aW9uIHJlY29nbml6ZU9uZShjb25maWc6IFJvdXRlW10sIHVybDogVHJlZU5vZGU8VXJsU2VnbWVudD4pOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90PltdIHtcbiAgY29uc3QgbWF0Y2hlcyA9IG1hdGNoKGNvbmZpZywgdXJsKTtcbiAgZm9yKGxldCBtYXRjaCBvZiBtYXRjaGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHByaW1hcnkgPSBjb25zdHJ1Y3RBY3RpdmF0ZWRSb3V0ZShtYXRjaCk7XG4gICAgICBjb25zdCBzZWNvbmRhcnkgPSByZWNvZ25pemVNYW55KGNvbmZpZywgbWF0Y2guc2Vjb25kYXJ5KTtcbiAgICAgIGNvbnN0IHJlcyA9IHByaW1hcnkuY29uY2F0KHNlY29uZGFyeSk7XG4gICAgICBjaGVja091dGxldE5hbWVVbmlxdWVuZXNzKHJlcyk7XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICghIChlIGluc3RhbmNlb2YgQ2Fubm90UmVjb2duaXplKSkge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgQ2Fubm90UmVjb2duaXplKCk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrT3V0bGV0TmFtZVVuaXF1ZW5lc3Mobm9kZXM6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlU25hcHNob3Q+W10pOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90PltdIHtcbiAgbGV0IG5hbWVzID0ge307XG4gIG5vZGVzLmZvckVhY2gobiA9PiB7XG4gICAgbGV0IHJvdXRlV2l0aFNhbWVPdXRsZXROYW1lID0gbmFtZXNbbi52YWx1ZS5vdXRsZXRdO1xuICAgIGlmIChyb3V0ZVdpdGhTYW1lT3V0bGV0TmFtZSkge1xuICAgICAgY29uc3QgcCA9IHJvdXRlV2l0aFNhbWVPdXRsZXROYW1lLnVybFNlZ21lbnRzLm1hcChzID0+IHMudG9TdHJpbmcoKSkuam9pbihcIi9cIik7XG4gICAgICBjb25zdCBjID0gbi52YWx1ZS51cmxTZWdtZW50cy5tYXAocyA9PiBzLnRvU3RyaW5nKCkpLmpvaW4oXCIvXCIpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUd28gc2VnbWVudHMgY2Fubm90IGhhdmUgdGhlIHNhbWUgb3V0bGV0IG5hbWU6ICcke3B9JyBhbmQgJyR7Y30nLmApO1xuICAgIH1cbiAgICBuYW1lc1tuLnZhbHVlLm91dGxldF0gPSBuLnZhbHVlO1xuICB9KTtcbiAgcmV0dXJuIG5vZGVzO1xufVxuXG5mdW5jdGlvbiBtYXRjaChjb25maWc6IFJvdXRlW10sIHVybDogVHJlZU5vZGU8VXJsU2VnbWVudD4pOiBNYXRjaFJlc3VsdFtdIHtcbiAgY29uc3QgcmVzID0gW107XG4gIGZvciAobGV0IHIgb2YgY29uZmlnKSB7XG4gICAgaWYgKHIuaW5kZXgpIHtcbiAgICAgIHJlcy5wdXNoKGNyZWF0ZUluZGV4TWF0Y2gociwgW3VybF0sIHVybC52YWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtID0gbWF0Y2hXaXRoUGFydHMociwgdXJsKTtcbiAgICAgIGlmIChtKSByZXMucHVzaChtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gY3JlYXRlSW5kZXhNYXRjaChyOiBSb3V0ZSwgbGVmdE92ZXJVcmxzOlRyZWVOb2RlPFVybFNlZ21lbnQ+W10sIGxhc3RVcmxTZWdtZW50OlVybFNlZ21lbnQpOiBNYXRjaFJlc3VsdCB7XG4gIGNvbnN0IG91dGxldCA9IHIub3V0bGV0ID8gci5vdXRsZXQgOiBQUklNQVJZX09VVExFVDtcbiAgY29uc3QgY2hpbGRyZW4gPSByLmNoaWxkcmVuID8gci5jaGlsZHJlbiA6IFtdO1xuICByZXR1cm4gbmV3IE1hdGNoUmVzdWx0KHIuY29tcG9uZW50LCBjaGlsZHJlbiwgW10sIGxhc3RVcmxTZWdtZW50LnBhcmFtZXRlcnMsIGxlZnRPdmVyVXJscywgW10sIG91dGxldCwgciwgbGFzdFVybFNlZ21lbnQpO1xufVxuXG5mdW5jdGlvbiBtYXRjaEluZGV4KGNvbmZpZzogUm91dGVbXSwgbGVmdE92ZXJVcmxzOiBUcmVlTm9kZTxVcmxTZWdtZW50PltdLCBsYXN0VXJsU2VnbWVudDogVXJsU2VnbWVudCk6IE1hdGNoUmVzdWx0IHwgbnVsbCB7XG4gIGZvciAobGV0IHIgb2YgY29uZmlnKSB7XG4gICAgaWYgKHIuaW5kZXgpIHtcbiAgICAgIHJldHVybiBjcmVhdGVJbmRleE1hdGNoKHIsIGxlZnRPdmVyVXJscywgbGFzdFVybFNlZ21lbnQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbWF0Y2hXaXRoUGFydHMocm91dGU6IFJvdXRlLCB1cmw6IFRyZWVOb2RlPFVybFNlZ21lbnQ+KTogTWF0Y2hSZXN1bHQgfCBudWxsIHtcbiAgaWYgKCFyb3V0ZS5wYXRoKSByZXR1cm4gbnVsbDtcbiAgaWYgKChyb3V0ZS5vdXRsZXQgPyByb3V0ZS5vdXRsZXQgOiBQUklNQVJZX09VVExFVCkgIT09IHVybC52YWx1ZS5vdXRsZXQpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHBhdGggPSByb3V0ZS5wYXRoLnN0YXJ0c1dpdGgoXCIvXCIpID8gcm91dGUucGF0aC5zdWJzdHJpbmcoMSkgOiByb3V0ZS5wYXRoO1xuICBpZiAocGF0aCA9PT0gXCIqKlwiKSB7XG4gICAgY29uc3QgY29uc3VtZWRVcmwgPSBbXTtcbiAgICBsZXQgdTpUcmVlTm9kZTxVcmxTZWdtZW50PnxudWxsID0gdXJsO1xuICAgIHdoaWxlICh1KSB7XG4gICAgICBjb25zdW1lZFVybC5wdXNoKHUudmFsdWUpO1xuICAgICAgdSA9IGZpcnN0KHUuY2hpbGRyZW4pO1xuICAgIH1cbiAgICBjb25zdCBsYXN0ID0gY29uc3VtZWRVcmxbY29uc3VtZWRVcmwubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIG5ldyBNYXRjaFJlc3VsdChyb3V0ZS5jb21wb25lbnQsIFtdLCBjb25zdW1lZFVybCwgbGFzdC5wYXJhbWV0ZXJzLCBbXSwgW10sIFBSSU1BUllfT1VUTEVULCByb3V0ZSwgbGFzdCk7XG4gIH1cblxuICBjb25zdCBwYXJ0cyA9IHBhdGguc3BsaXQoXCIvXCIpO1xuICBjb25zdCBwb3NpdGlvbmFsUGFyYW1zID0ge307XG4gIGNvbnN0IGNvbnN1bWVkVXJsU2VnbWVudHMgPSBbXTtcblxuICBsZXQgbGFzdFBhcmVudDogVHJlZU5vZGU8VXJsU2VnbWVudD58bnVsbCA9IG51bGw7XG4gIGxldCBsYXN0U2VnbWVudDogVHJlZU5vZGU8VXJsU2VnbWVudD58bnVsbCA9IG51bGw7XG5cbiAgbGV0IGN1cnJlbnQ6IFRyZWVOb2RlPFVybFNlZ21lbnQ+fG51bGwgPSB1cmw7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoIWN1cnJlbnQpIHJldHVybiBudWxsO1xuXG4gICAgY29uc3QgcCA9IHBhcnRzW2ldO1xuICAgIGNvbnN0IGlzTGFzdFNlZ21lbnQgPSBpID09PSBwYXJ0cy5sZW5ndGggLSAxO1xuICAgIGNvbnN0IGlzTGFzdFBhcmVudCA9IGkgPT09IHBhcnRzLmxlbmd0aCAtIDI7XG4gICAgY29uc3QgaXNQb3NQYXJhbSA9IHAuc3RhcnRzV2l0aChcIjpcIik7XG5cbiAgICBpZiAoIWlzUG9zUGFyYW0gJiYgcCAhPSBjdXJyZW50LnZhbHVlLnBhdGgpIHJldHVybiBudWxsO1xuICAgIGlmIChpc0xhc3RTZWdtZW50KSB7XG4gICAgICBsYXN0U2VnbWVudCA9IGN1cnJlbnQ7XG4gICAgfVxuICAgIGlmIChpc0xhc3RQYXJlbnQpIHtcbiAgICAgIGxhc3RQYXJlbnQgPSBjdXJyZW50O1xuICAgIH1cblxuICAgIGlmIChpc1Bvc1BhcmFtKSB7XG4gICAgICBwb3NpdGlvbmFsUGFyYW1zW3Auc3Vic3RyaW5nKDEpXSA9IGN1cnJlbnQudmFsdWUucGF0aDtcbiAgICB9XG5cbiAgICBjb25zdW1lZFVybFNlZ21lbnRzLnB1c2goY3VycmVudC52YWx1ZSk7XG5cbiAgICBjdXJyZW50ID0gZmlyc3QoY3VycmVudC5jaGlsZHJlbik7XG4gIH1cblxuICBpZiAoIWxhc3RTZWdtZW50KSB0aHJvdyBcIkNhbm5vdCBiZSByZWFjaGVkXCI7XG5cbiAgY29uc3QgcCA9IGxhc3RTZWdtZW50LnZhbHVlLnBhcmFtZXRlcnM7XG4gIGNvbnN0IHBhcmFtZXRlcnMgPSA8e1trZXk6IHN0cmluZ106IHN0cmluZ30+bWVyZ2UocCwgcG9zaXRpb25hbFBhcmFtcyk7XG4gIGNvbnN0IHNlY29uZGFyeVN1YnRyZWVzID0gbGFzdFBhcmVudCA/IGxhc3RQYXJlbnQuY2hpbGRyZW4uc2xpY2UoMSkgOiBbXTtcbiAgY29uc3QgY2hpbGRyZW4gPSByb3V0ZS5jaGlsZHJlbiA/IHJvdXRlLmNoaWxkcmVuIDogW107XG4gIGNvbnN0IG91dGxldCA9IHJvdXRlLm91dGxldCA/IHJvdXRlLm91dGxldCA6IFBSSU1BUllfT1VUTEVUO1xuXG4gIHJldHVybiBuZXcgTWF0Y2hSZXN1bHQocm91dGUuY29tcG9uZW50LCBjaGlsZHJlbiwgY29uc3VtZWRVcmxTZWdtZW50cywgcGFyYW1ldGVycywgbGFzdFNlZ21lbnQuY2hpbGRyZW4sXG4gICAgc2Vjb25kYXJ5U3VidHJlZXMsIG91dGxldCwgcm91dGUsIGxhc3RTZWdtZW50LnZhbHVlKTtcbn1cblxuY2xhc3MgTWF0Y2hSZXN1bHQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgY29tcG9uZW50OiBUeXBlIHwgc3RyaW5nLFxuICAgICAgICAgICAgICBwdWJsaWMgY2hpbGRyZW46IFJvdXRlW10sXG4gICAgICAgICAgICAgIHB1YmxpYyBjb25zdW1lZFVybFNlZ21lbnRzOiBVcmxTZWdtZW50W10sXG4gICAgICAgICAgICAgIHB1YmxpYyBwYXJhbWV0ZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICAgICAgICAgICAgcHVibGljIGxlZnRPdmVyVXJsOiBUcmVlTm9kZTxVcmxTZWdtZW50PltdLFxuICAgICAgICAgICAgICBwdWJsaWMgc2Vjb25kYXJ5OiBUcmVlTm9kZTxVcmxTZWdtZW50PltdLFxuICAgICAgICAgICAgICBwdWJsaWMgb3V0bGV0OiBzdHJpbmcsXG4gICAgICAgICAgICAgIHB1YmxpYyByb3V0ZTogUm91dGUgfCBudWxsLFxuICAgICAgICAgICAgICBwdWJsaWMgbGFzdFVybFNlZ21lbnQ6IFVybFNlZ21lbnRcbiAgKSB7fVxufSJdfQ==