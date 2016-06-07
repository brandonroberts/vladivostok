"use strict";
var core_1 = require('@angular/core');
var router_outlet_map_1 = require('./router_outlet_map');
var recognize_1 = require('./recognize');
var resolve_1 = require('./resolve');
var create_router_state_1 = require('./create_router_state');
var url_tree_1 = require('./url_tree');
var shared_1 = require('./shared');
var router_state_1 = require('./router_state');
var create_url_tree_1 = require('./create_url_tree');
var collection_1 = require('./utils/collection');
var Observable_1 = require('rxjs/Observable');
var Subject_1 = require('rxjs/Subject');
require('rxjs/add/operator/map');
require('rxjs/add/operator/scan');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/concat');
require('rxjs/add/operator/concatMap');
var of_1 = require('rxjs/observable/of');
var forkJoin_1 = require('rxjs/observable/forkJoin');
var NavigationStart = (function () {
    function NavigationStart(id, url) {
        this.id = id;
        this.url = url;
    }
    return NavigationStart;
}());
exports.NavigationStart = NavigationStart;
var NavigationEnd = (function () {
    function NavigationEnd(id, url) {
        this.id = id;
        this.url = url;
    }
    return NavigationEnd;
}());
exports.NavigationEnd = NavigationEnd;
var NavigationCancel = (function () {
    function NavigationCancel(id, url) {
        this.id = id;
        this.url = url;
    }
    return NavigationCancel;
}());
exports.NavigationCancel = NavigationCancel;
var NavigationError = (function () {
    function NavigationError(id, url, error) {
        this.id = id;
        this.url = url;
        this.error = error;
    }
    return NavigationError;
}());
exports.NavigationError = NavigationError;
var Router = (function () {
    function Router(rootComponentType, resolver, urlSerializer, outletMap, location, injector, config) {
        this.rootComponentType = rootComponentType;
        this.resolver = resolver;
        this.urlSerializer = urlSerializer;
        this.outletMap = outletMap;
        this.location = location;
        this.injector = injector;
        this.config = config;
        this.navigationId = 0;
        this.routerEvents = new Subject_1.Subject();
        this.currentUrlTree = url_tree_1.createEmptyUrlTree();
        this.currentRouterState = router_state_1.createEmptyState(rootComponentType);
        this.setUpLocationChangeListener();
        this.navigateByUrl(this.location.path());
    }
    Object.defineProperty(Router.prototype, "routerState", {
        get: function () {
            return this.currentRouterState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Router.prototype, "urlTree", {
        get: function () {
            return this.currentUrlTree;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Router.prototype, "events", {
        get: function () {
            return this.routerEvents;
        },
        enumerable: true,
        configurable: true
    });
    Router.prototype.navigateByUrl = function (url) {
        var urlTree = this.urlSerializer.parse(url);
        return this.scheduleNavigation(urlTree, false);
    };
    Router.prototype.resetConfig = function (config) {
        this.config = config;
    };
    Router.prototype.dispose = function () { this.locationSubscription.unsubscribe(); };
    Router.prototype.createUrlTree = function (commands, _a) {
        var _b = _a === void 0 ? {} : _a, relativeTo = _b.relativeTo, queryParams = _b.queryParams, fragment = _b.fragment;
        var a = relativeTo ? relativeTo : this.routerState.root;
        return create_url_tree_1.createUrlTree(a, this.currentUrlTree, commands, queryParams, fragment);
    };
    Router.prototype.navigate = function (commands, extras) {
        if (extras === void 0) { extras = {}; }
        return this.scheduleNavigation(this.createUrlTree(commands, extras), false);
    };
    Router.prototype.serializeUrl = function (url) { return this.urlSerializer.serialize(url); };
    Router.prototype.parseUrl = function (url) { return this.urlSerializer.parse(url); };
    Router.prototype.scheduleNavigation = function (url, pop) {
        var _this = this;
        var id = ++this.navigationId;
        this.routerEvents.next(new NavigationStart(id, url));
        return Promise.resolve().then(function (_) { return _this.runNavigate(url, false, id); });
    };
    Router.prototype.setUpLocationChangeListener = function () {
        var _this = this;
        this.locationSubscription = this.location.subscribe(function (change) {
            return _this.scheduleNavigation(_this.urlSerializer.parse(change['url']), change['pop']);
        });
    };
    Router.prototype.runNavigate = function (url, pop, id) {
        var _this = this;
        if (id !== this.navigationId) {
            this.routerEvents.next(new NavigationCancel(id, url));
            return Promise.resolve(false);
        }
        return new Promise(function (resolvePromise, rejectPromise) {
            var state;
            recognize_1.recognize(_this.rootComponentType, _this.config, url).mergeMap(function (newRouterStateSnapshot) {
                return resolve_1.resolve(_this.resolver, newRouterStateSnapshot);
            }).map(function (routerStateSnapshot) {
                return create_router_state_1.createRouterState(routerStateSnapshot, _this.currentRouterState);
            }).map(function (newState) {
                state = newState;
            }).mergeMap(function (_) {
                return new GuardChecks(state.snapshot, _this.currentRouterState.snapshot, _this.injector).check(_this.outletMap);
            }).forEach(function (shouldActivate) {
                if (!shouldActivate || id !== _this.navigationId) {
                    _this.routerEvents.next(new NavigationCancel(id, url));
                    return Promise.resolve(false);
                }
                new ActivateRoutes(state, _this.currentRouterState).activate(_this.outletMap);
                _this.currentUrlTree = url;
                _this.currentRouterState = state;
                if (!pop) {
                    _this.location.go(_this.urlSerializer.serialize(url));
                }
            }).then(function () {
                _this.routerEvents.next(new NavigationEnd(id, url));
                resolvePromise(true);
            }, function (e) {
                _this.routerEvents.next(new NavigationError(id, url, e));
                rejectPromise(e);
            });
        });
    };
    return Router;
}());
exports.Router = Router;
var CanActivate = (function () {
    function CanActivate(route) {
        this.route = route;
    }
    return CanActivate;
}());
var CanDeactivate = (function () {
    function CanDeactivate(component, route) {
        this.component = component;
        this.route = route;
    }
    return CanDeactivate;
}());
var GuardChecks = (function () {
    function GuardChecks(future, curr, injector) {
        this.future = future;
        this.curr = curr;
        this.injector = injector;
        this.checks = [];
    }
    GuardChecks.prototype.check = function (parentOutletMap) {
        var _this = this;
        var futureRoot = this.future._root;
        var currRoot = this.curr ? this.curr._root : null;
        this.traverseChildRoutes(futureRoot, currRoot, parentOutletMap);
        if (this.checks.length === 0)
            return of_1.of(true);
        return forkJoin_1.forkJoin(this.checks.map(function (s) {
            if (s instanceof CanActivate) {
                return _this.runCanActivate(s.route);
            }
            else if (s instanceof CanDeactivate) {
                return _this.runCanDeactivate(s.component, s.route);
            }
            else {
                throw new Error("Cannot be reached");
            }
        })).map(collection_1.and);
    };
    GuardChecks.prototype.traverseChildRoutes = function (futureNode, currNode, outletMap) {
        var _this = this;
        var prevChildren = nodeChildrenAsMap(currNode);
        futureNode.children.forEach(function (c) {
            _this.traverseRoutes(c, prevChildren[c.value.outlet], outletMap);
            delete prevChildren[c.value.outlet];
        });
        collection_1.forEach(prevChildren, function (v, k) { return _this.deactivateOutletAndItChildren(v, outletMap._outlets[k]); });
    };
    GuardChecks.prototype.traverseRoutes = function (futureNode, currNode, parentOutletMap) {
        var future = futureNode.value;
        var curr = currNode ? currNode.value : null;
        var outlet = parentOutletMap ? parentOutletMap._outlets[futureNode.value.outlet] : null;
        if (curr && future._routeConfig === curr._routeConfig) {
            if (!collection_1.shallowEqual(future.params, curr.params)) {
                this.checks.push(new CanDeactivate(outlet.component, curr), new CanActivate(future));
            }
            this.traverseChildRoutes(futureNode, currNode, outlet ? outlet.outletMap : null);
        }
        else {
            this.deactivateOutletAndItChildren(curr, outlet);
            this.checks.push(new CanActivate(future));
            this.traverseChildRoutes(futureNode, null, outlet ? outlet.outletMap : null);
        }
    };
    GuardChecks.prototype.deactivateOutletAndItChildren = function (route, outlet) {
        var _this = this;
        if (outlet && outlet.isActivated) {
            collection_1.forEach(outlet.outletMap._outlets, function (v, k) { return _this.deactivateOutletAndItChildren(v, outlet.outletMap._outlets[k]); });
            this.checks.push(new CanDeactivate(outlet.component, route));
        }
    };
    GuardChecks.prototype.runCanActivate = function (future) {
        var _this = this;
        var canActivate = future._routeConfig ? future._routeConfig.canActivate : null;
        if (!canActivate || canActivate.length === 0)
            return of_1.of(true);
        return forkJoin_1.forkJoin(canActivate.map(function (c) {
            var guard = _this.injector.get(c);
            if (guard.canActivate) {
                return wrapIntoObservable(guard.canActivate(future, _this.future));
            }
            else {
                return wrapIntoObservable(guard(future, _this.future));
            }
        })).map(collection_1.and);
    };
    GuardChecks.prototype.runCanDeactivate = function (component, curr) {
        var _this = this;
        var canDeactivate = curr._routeConfig ? curr._routeConfig.canDeactivate : null;
        if (!canDeactivate || canDeactivate.length === 0)
            return of_1.of(true);
        return forkJoin_1.forkJoin(canDeactivate.map(function (c) {
            var guard = _this.injector.get(c);
            if (guard.canDeactivate) {
                return wrapIntoObservable(guard.canDeactivate(component, curr, _this.curr));
            }
            else {
                return wrapIntoObservable(guard(component, curr, _this.curr));
            }
        })).map(collection_1.and);
    };
    return GuardChecks;
}());
function wrapIntoObservable(value) {
    if (value instanceof Observable_1.Observable) {
        return value;
    }
    else {
        return of_1.of(value);
    }
}
var ActivateRoutes = (function () {
    function ActivateRoutes(futureState, currState) {
        this.futureState = futureState;
        this.currState = currState;
    }
    ActivateRoutes.prototype.activate = function (parentOutletMap) {
        var futureRoot = this.futureState._root;
        var currRoot = this.currState ? this.currState._root : null;
        pushQueryParamsAndFragment(this.futureState);
        this.activateChildRoutes(futureRoot, currRoot, parentOutletMap);
    };
    ActivateRoutes.prototype.activateChildRoutes = function (futureNode, currNode, outletMap) {
        var _this = this;
        var prevChildren = nodeChildrenAsMap(currNode);
        futureNode.children.forEach(function (c) {
            _this.activateRoutes(c, prevChildren[c.value.outlet], outletMap);
            delete prevChildren[c.value.outlet];
        });
        collection_1.forEach(prevChildren, function (v, k) { return _this.deactivateOutletAndItChildren(outletMap._outlets[k]); });
    };
    ActivateRoutes.prototype.activateRoutes = function (futureNode, currNode, parentOutletMap) {
        var future = futureNode.value;
        var curr = currNode ? currNode.value : null;
        var outlet = getOutlet(parentOutletMap, futureNode.value);
        if (future === curr) {
            router_state_1.advanceActivatedRoute(future);
            this.activateChildRoutes(futureNode, currNode, outlet.outletMap);
        }
        else {
            this.deactivateOutletAndItChildren(outlet);
            var outletMap = new router_outlet_map_1.RouterOutletMap();
            this.activateNewRoutes(outletMap, future, outlet);
            this.activateChildRoutes(futureNode, null, outletMap);
        }
    };
    ActivateRoutes.prototype.activateNewRoutes = function (outletMap, future, outlet) {
        var resolved = core_1.ReflectiveInjector.resolve([
            { provide: router_state_1.ActivatedRoute, useValue: future },
            { provide: router_outlet_map_1.RouterOutletMap, useValue: outletMap }
        ]);
        outlet.activate(future._futureSnapshot._resolvedComponentFactory, resolved, outletMap);
        router_state_1.advanceActivatedRoute(future);
    };
    ActivateRoutes.prototype.deactivateOutletAndItChildren = function (outlet) {
        var _this = this;
        if (outlet && outlet.isActivated) {
            collection_1.forEach(outlet.outletMap._outlets, function (v, k) { return _this.deactivateOutletAndItChildren(v); });
            outlet.deactivate();
        }
    };
    return ActivateRoutes;
}());
function pushQueryParamsAndFragment(state) {
    if (!collection_1.shallowEqual(state.snapshot.queryParams, state.queryParams.value)) {
        state.queryParams.next(state.snapshot.queryParams);
    }
    if (state.snapshot.fragment !== state.fragment.value) {
        state.fragment.next(state.snapshot.fragment);
    }
}
function nodeChildrenAsMap(node) {
    return node ?
        node.children.reduce(function (m, c) {
            m[c.value.outlet] = c;
            return m;
        }, {}) :
        {};
}
function getOutlet(outletMap, route) {
    var outlet = outletMap._outlets[route.outlet];
    if (!outlet) {
        if (route.outlet === shared_1.PRIMARY_OUTLET) {
            throw new Error("Cannot find primary outlet");
        }
        else {
            throw new Error("Cannot find the outlet " + route.outlet);
        }
    }
    return outlet;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXNFLGVBQWUsQ0FBQyxDQUFBO0FBR3RGLGtDQUFnQyxxQkFBcUIsQ0FBQyxDQUFBO0FBQ3RELDBCQUEwQixhQUFhLENBQUMsQ0FBQTtBQUN4Qyx3QkFBd0IsV0FBVyxDQUFDLENBQUE7QUFDcEMsb0NBQWtDLHVCQUF1QixDQUFDLENBQUE7QUFFMUQseUJBQTRDLFlBQVksQ0FBQyxDQUFBO0FBQ3pELHVCQUF1QyxVQUFVLENBQUMsQ0FBQTtBQUNsRCw2QkFBaUksZ0JBQWdCLENBQUMsQ0FBQTtBQUdsSixnQ0FBOEIsbUJBQW1CLENBQUMsQ0FBQTtBQUNsRCwyQkFBMkMsb0JBQW9CLENBQUMsQ0FBQTtBQUNoRSwyQkFBMkIsaUJBQWlCLENBQUMsQ0FBQTtBQUU3Qyx3QkFBd0IsY0FBYyxDQUFDLENBQUE7QUFDdkMsUUFBTyx1QkFBdUIsQ0FBQyxDQUFBO0FBQy9CLFFBQU8sd0JBQXdCLENBQUMsQ0FBQTtBQUNoQyxRQUFPLDRCQUE0QixDQUFDLENBQUE7QUFDcEMsUUFBTywwQkFBMEIsQ0FBQyxDQUFBO0FBQ2xDLFFBQU8sNkJBQTZCLENBQUMsQ0FBQTtBQUNyQyxtQkFBaUIsb0JBQW9CLENBQUMsQ0FBQTtBQUN0Qyx5QkFBdUIsMEJBQTBCLENBQUMsQ0FBQTtBQU9sRDtJQUErQix5QkFBbUIsRUFBUyxFQUFTLEdBQVc7UUFBN0IsT0FBRSxHQUFGLEVBQUUsQ0FBTztRQUFTLFFBQUcsR0FBSCxHQUFHLENBQVE7SUFBRyxDQUFDO0lBQUMsc0JBQUM7QUFBRCxDQUFDLEFBQXJGLElBQXFGO0FBQXhFLHVCQUFlLGtCQUF5RCxDQUFBO0FBS3JGO0lBQTZCLHVCQUFtQixFQUFTLEVBQVMsR0FBVztRQUE3QixPQUFFLEdBQUYsRUFBRSxDQUFPO1FBQVMsUUFBRyxHQUFILEdBQUcsQ0FBUTtJQUFHLENBQUM7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QXdCO0lBQ2pELE1BQU0sQ0FBQyxJQUFJO1FBQ1QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQ2xCLFVBQUMsQ0FBQyxFQUFFLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEIsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsRUFDRCxFQUFFLENBQUM7UUFDUCxFQUFFLENBQUM7QUFDTCxDQUFDO0FBRUQsbUJBQW1CLFNBQTBCLEVBQUUsS0FBcUI7SUFDbEUsSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ1osRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyx1QkFBYyxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBMEIsS0FBSyxDQUFDLE1BQVEsQ0FBQyxDQUFDO1FBQzVELENBQUM7SUFDSCxDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50UmVzb2x2ZXIsIFJlZmxlY3RpdmVJbmplY3RvciwgVHlwZSwgSW5qZWN0b3IgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IExvY2F0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IFVybFNlcmlhbGl6ZXIgfSBmcm9tICcuL3VybF9zZXJpYWxpemVyJztcbmltcG9ydCB7IFJvdXRlck91dGxldE1hcCB9IGZyb20gJy4vcm91dGVyX291dGxldF9tYXAnO1xuaW1wb3J0IHsgcmVjb2duaXplIH0gZnJvbSAnLi9yZWNvZ25pemUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJy4vcmVzb2x2ZSc7XG5pbXBvcnQgeyBjcmVhdGVSb3V0ZXJTdGF0ZSB9IGZyb20gJy4vY3JlYXRlX3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQgeyBUcmVlTm9kZSB9IGZyb20gJy4vdXRpbHMvdHJlZSc7XG5pbXBvcnQgeyBVcmxUcmVlLCBjcmVhdGVFbXB0eVVybFRyZWUgfSBmcm9tICcuL3VybF90cmVlJztcbmltcG9ydCB7IFBSSU1BUllfT1VUTEVULCBQYXJhbXMgfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQgeyBjcmVhdGVFbXB0eVN0YXRlLCBSb3V0ZXJTdGF0ZSwgUm91dGVyU3RhdGVTbmFwc2hvdCwgQWN0aXZhdGVkUm91dGUsIEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIGFkdmFuY2VBY3RpdmF0ZWRSb3V0ZX0gZnJvbSAnLi9yb3V0ZXJfc3RhdGUnO1xuaW1wb3J0IHsgUm91dGVyQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHsgUm91dGVyT3V0bGV0IH0gZnJvbSAnLi9kaXJlY3RpdmVzL3JvdXRlcl9vdXRsZXQnO1xuaW1wb3J0IHsgY3JlYXRlVXJsVHJlZSB9IGZyb20gJy4vY3JlYXRlX3VybF90cmVlJztcbmltcG9ydCB7IGZvckVhY2gsIGFuZCwgc2hhbGxvd0VxdWFsIH0gZnJvbSAnLi91dGlscy9jb2xsZWN0aW9uJztcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tICdyeGpzL09ic2VydmFibGUnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcy9TdWJzY3JpcHRpb24nO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMvU3ViamVjdCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL21hcCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL3NjYW4nO1xuaW1wb3J0ICdyeGpzL2FkZC9vcGVyYXRvci9tZXJnZU1hcCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL2NvbmNhdCc7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL2NvbmNhdE1hcCc7XG5pbXBvcnQge29mfSBmcm9tICdyeGpzL29ic2VydmFibGUvb2YnO1xuaW1wb3J0IHtmb3JrSm9pbn0gZnJvbSAncnhqcy9vYnNlcnZhYmxlL2ZvcmtKb2luJztcblxuZXhwb3J0IGludGVyZmFjZSBOYXZpZ2F0aW9uRXh0cmFzIHsgcmVsYXRpdmVUbz86IEFjdGl2YXRlZFJvdXRlOyBxdWVyeVBhcmFtcz86IFBhcmFtczsgZnJhZ21lbnQ/OiBzdHJpbmc7IH1cblxuLyoqXG4gKiBBbiBldmVudCB0cmlnZ2VyZWQgd2hlbiBhIG5hdmlnYXRpb24gc3RhcnRzXG4gKi9cbmV4cG9ydCBjbGFzcyBOYXZpZ2F0aW9uU3RhcnQgeyBjb25zdHJ1Y3RvcihwdWJsaWMgaWQ6bnVtYmVyLCBwdWJsaWMgdXJsOlVybFRyZWUpIHt9IH1cblxuLyoqXG4gKiBBbiBldmVudCB0cmlnZ2VyZWQgd2hlbiBhIG5hdmlnYXRpb24gZW5kcyBzdWNjZXNzZnVsbHlcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25FbmQgeyBjb25zdHJ1Y3RvcihwdWJsaWMgaWQ6bnVtYmVyLCBwdWJsaWMgdXJsOlVybFRyZWUpIHt9IH1cblxuLyoqXG4gKiBBbiBldmVudCB0cmlnZ2VyZWQgd2hlbiBhIG5hdmlnYXRpb24gaXMgY2FuY2VsZWRcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25DYW5jZWwgeyBjb25zdHJ1Y3RvcihwdWJsaWMgaWQ6bnVtYmVyLCBwdWJsaWMgdXJsOlVybFRyZWUpIHt9IH1cblxuLyoqXG4gKiBBbiBldmVudCB0cmlnZ2VyZWQgd2hlbiBhIG5hdmlnYXRpb24gZmFpbHMgZHVlIHRvIHVuZXhwZWN0ZWQgZXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25FcnJvciB7IGNvbnN0cnVjdG9yKHB1YmxpYyBpZDpudW1iZXIsIHB1YmxpYyB1cmw6VXJsVHJlZSwgcHVibGljIGVycm9yOmFueSkge30gfVxuXG5leHBvcnQgdHlwZSBFdmVudCA9IE5hdmlnYXRpb25TdGFydCB8IE5hdmlnYXRpb25FbmQgfCBOYXZpZ2F0aW9uQ2FuY2VsIHwgTmF2aWdhdGlvbkVycm9yO1xuXG4vKipcbiAqIFRoZSBgUm91dGVyYCBpcyByZXNwb25zaWJsZSBmb3IgbWFwcGluZyBVUkxzIHRvIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZXIge1xuICBwcml2YXRlIGN1cnJlbnRVcmxUcmVlOiBVcmxUcmVlO1xuICBwcml2YXRlIGN1cnJlbnRSb3V0ZXJTdGF0ZTogUm91dGVyU3RhdGU7XG4gIHByaXZhdGUgbG9jYXRpb25TdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgcHJpdmF0ZSByb3V0ZXJFdmVudHM6IFN1YmplY3Q8RXZlbnQ+O1xuICBwcml2YXRlIG5hdmlnYXRpb25JZDogbnVtYmVyID0gMDtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3RDb21wb25lbnRUeXBlOlR5cGUsIHByaXZhdGUgcmVzb2x2ZXI6IENvbXBvbmVudFJlc29sdmVyLCBwcml2YXRlIHVybFNlcmlhbGl6ZXI6IFVybFNlcmlhbGl6ZXIsIHByaXZhdGUgb3V0bGV0TWFwOiBSb3V0ZXJPdXRsZXRNYXAsIHByaXZhdGUgbG9jYXRpb246IExvY2F0aW9uLCBwcml2YXRlIGluamVjdG9yOiBJbmplY3RvciwgcHJpdmF0ZSBjb25maWc6IFJvdXRlckNvbmZpZykge1xuICAgIHRoaXMucm91dGVyRXZlbnRzID0gbmV3IFN1YmplY3Q8RXZlbnQ+KCk7XG4gICAgdGhpcy5jdXJyZW50VXJsVHJlZSA9IGNyZWF0ZUVtcHR5VXJsVHJlZSgpO1xuICAgIHRoaXMuY3VycmVudFJvdXRlclN0YXRlID0gY3JlYXRlRW1wdHlTdGF0ZShyb290Q29tcG9uZW50VHlwZSk7XG4gICAgdGhpcy5zZXRVcExvY2F0aW9uQ2hhbmdlTGlzdGVuZXIoKTtcbiAgICB0aGlzLm5hdmlnYXRlQnlVcmwodGhpcy5sb2NhdGlvbi5wYXRoKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1cnJlbnQgcm91dGUgc3RhdGUuXG4gICAqL1xuICBnZXQgcm91dGVyU3RhdGUoKTogUm91dGVyU3RhdGUge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRSb3V0ZXJTdGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHVybCB0cmVlLlxuICAgKi9cbiAgZ2V0IHVybFRyZWUoKTogVXJsVHJlZSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFVybFRyZWU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvYnNlcnZhYmxlIG9mIHJvdXRlIGV2ZW50c1xuICAgKi9cbiAgZ2V0IGV2ZW50cygpOiBPYnNlcnZhYmxlPEV2ZW50PiB7XG4gICAgcmV0dXJuIHRoaXMucm91dGVyRXZlbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIE5hdmlnYXRlIGJhc2VkIG9uIHRoZSBwcm92aWRlZCB1cmwuIFRoaXMgbmF2aWdhdGlvbiBpcyBhbHdheXMgYWJzb2x1dGUuXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQ6XG4gICAqIC0gaXMgcmVzb2x2ZWQgd2l0aCAndHJ1ZScgd2hlbiBuYXZpZ2F0aW9uIHN1Y2NlZWRzXG4gICAqIC0gaXMgcmVzb2x2ZWQgd2l0aCAnZmFsc2UnIHdoZW4gbmF2aWdhdGlvbiBmYWlsc1xuICAgKiAtIGlzIHJlamVjdGVkIHdoZW4gYW4gZXJyb3IgaGFwcGVuc1xuICAgKlxuICAgKiAjIyMgVXNhZ2VcbiAgICpcbiAgICogYGBgXG4gICAqIHJvdXRlci5uYXZpZ2F0ZUJ5VXJsKFwiL3RlYW0vMzMvdXNlci8xMVwiKTtcbiAgICogYGBgXG4gICAqL1xuICBuYXZpZ2F0ZUJ5VXJsKHVybDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdXJsVHJlZSA9IHRoaXMudXJsU2VyaWFsaXplci5wYXJzZSh1cmwpO1xuICAgIHJldHVybiB0aGlzLnNjaGVkdWxlTmF2aWdhdGlvbih1cmxUcmVlLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSBjb25maWd1cmF0aW9uIHVzZWQgZm9yIG5hdmlnYXRpb24gYW5kIGdlbmVyYXRpbmcgbGlua3MuXG4gICAqXG4gICAqICMjIyBVc2FnZVxuICAgKlxuICAgKiBgYGBcbiAgICogcm91dGVyLnJlc2V0Q29uZmlnKFtcbiAgICogIHsgcGF0aDogJ3RlYW0vOmlkJywgY29tcG9uZW50OiBUZWFtQ21wLCBjaGlsZHJlbjogW1xuICAgKiAgICB7IHBhdGg6ICdzaW1wbGUnLCBjb21wb25lbnQ6IFNpbXBsZUNtcCB9LFxuICAgKiAgICB7IHBhdGg6ICd1c2VyLzpuYW1lJywgY29tcG9uZW50OiBVc2VyQ21wIH1cbiAgICogIF0gfVxuICAgKiBdKTtcbiAgICogYGBgXG4gICAqL1xuICByZXNldENvbmZpZyhjb25maWc6IFJvdXRlckNvbmZpZyk6IHZvaWQge1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgZGlzcG9zZSgpOiB2b2lkIHsgdGhpcy5sb2NhdGlvblN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpOyB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYW4gYXJyYXkgb2YgY29tbWFuZHMgdG8gdGhlIGN1cnJlbnQgdXJsIHRyZWUgYW5kIGNyZWF0ZXNcbiAgICogYSBuZXcgdXJsIHRyZWUuXG4gICAqXG4gICAqIFdoZW4gZ2l2ZW4gYW4gYWN0aXZhdGUgcm91dGUsIGFwcGxpZXMgdGhlIGdpdmVuIGNvbW1hbmRzIHN0YXJ0aW5nIGZyb20gdGhlIHJvdXRlLlxuICAgKiBXaGVuIG5vdCBnaXZlbiBhIHJvdXRlLCBhcHBsaWVzIHRoZSBnaXZlbiBjb21tYW5kIHN0YXJ0aW5nIGZyb20gdGhlIHJvb3QuXG4gICAqXG4gICAqICMjIyBVc2FnZVxuICAgKlxuICAgKiBgYGBcbiAgICogLy8gY3JlYXRlIC90ZWFtLzMzL3VzZXIvMTFcbiAgICogcm91dGVyLmNyZWF0ZVVybFRyZWUoWycvdGVhbScsIDMzLCAndXNlcicsIDExXSk7XG4gICAqXG4gICAqIC8vIGNyZWF0ZSAvdGVhbS8zMztleHBhbmQ9dHJ1ZS91c2VyLzExXG4gICAqIHJvdXRlci5jcmVhdGVVcmxUcmVlKFsnL3RlYW0nLCAzMywge2V4cGFuZDogdHJ1ZX0sICd1c2VyJywgMTFdKTtcbiAgICpcbiAgICogLy8geW91IGNhbiBjb2xsYXBzZSBzdGF0aWMgZnJhZ21lbnRzIGxpa2UgdGhpc1xuICAgKiByb3V0ZXIuY3JlYXRlVXJsVHJlZShbJy90ZWFtLzMzL3VzZXInLCB1c2VySWRdKTtcbiAgICpcbiAgICogLy8gYXNzdW1pbmcgdGhlIGN1cnJlbnQgdXJsIGlzIGAvdGVhbS8zMy91c2VyLzExYCBhbmQgdGhlIHJvdXRlIHBvaW50cyB0byBgdXNlci8xMWBcbiAgICpcbiAgICogLy8gbmF2aWdhdGUgdG8gL3RlYW0vMzMvdXNlci8xMS9kZXRhaWxzXG4gICAqIHJvdXRlci5jcmVhdGVVcmxUcmVlKFsnZGV0YWlscyddLCB7cmVsYXRpdmVUbzogcm91dGV9KTtcbiAgICpcbiAgICogLy8gbmF2aWdhdGUgdG8gL3RlYW0vMzMvdXNlci8yMlxuICAgKiByb3V0ZXIuY3JlYXRlVXJsVHJlZShbJy4uLzIyJ10sIHtyZWxhdGl2ZVRvOiByb3V0ZX0pO1xuICAgKlxuICAgKiAvLyBuYXZpZ2F0ZSB0byAvdGVhbS80NC91c2VyLzIyXG4gICAqIHJvdXRlci5jcmVhdGVVcmxUcmVlKFsnLi4vLi4vdGVhbS80NC91c2VyLzIyJ10sIHtyZWxhdGl2ZVRvOiByb3V0ZX0pO1xuICAgKiBgYGBcbiAgICovXG4gIGNyZWF0ZVVybFRyZWUoY29tbWFuZHM6IGFueVtdLCB7cmVsYXRpdmVUbywgcXVlcnlQYXJhbXMsIGZyYWdtZW50fTogTmF2aWdhdGlvbkV4dHJhcyA9IHt9KTogVXJsVHJlZSB7XG4gICAgY29uc3QgYSA9IHJlbGF0aXZlVG8gPyByZWxhdGl2ZVRvIDogdGhpcy5yb3V0ZXJTdGF0ZS5yb290O1xuICAgIHJldHVybiBjcmVhdGVVcmxUcmVlKGEsIHRoaXMuY3VycmVudFVybFRyZWUsIGNvbW1hbmRzLCBxdWVyeVBhcmFtcywgZnJhZ21lbnQpO1xuICB9XG5cblxuICAvKipcbiAgICogTmF2aWdhdGUgYmFzZWQgb24gdGhlIHByb3ZpZGVkIGFycmF5IG9mIGNvbW1hbmRzIGFuZCBhIHN0YXJ0aW5nIHBvaW50LlxuICAgKiBJZiBubyBzdGFydGluZyByb3V0ZSBpcyBwcm92aWRlZCwgdGhlIG5hdmlnYXRpb24gaXMgYWJzb2x1dGUuXG4gICAqXG4gICAqIFJldHVybnMgYSBwcm9taXNlIHRoYXQ6XG4gICAqIC0gaXMgcmVzb2x2ZWQgd2l0aCAndHJ1ZScgd2hlbiBuYXZpZ2F0aW9uIHN1Y2NlZWRzXG4gICAqIC0gaXMgcmVzb2x2ZWQgd2l0aCAnZmFsc2UnIHdoZW4gbmF2aWdhdGlvbiBmYWlsc1xuICAgKiAtIGlzIHJlamVjdGVkIHdoZW4gYW4gZXJyb3IgaGFwcGVuc1xuICAgKlxuICAgKiAjIyMgVXNhZ2VcbiAgICpcbiAgICogYGBgXG4gICAqIHJvdXRlci5uYXZpZ2F0ZShbJ3RlYW0nLCAzMywgJ3RlYW0nLCAnMTFdLCB7cmVsYXRpdmVUbzogcm91dGV9KTtcbiAgICogYGBgXG4gICAqL1xuICBuYXZpZ2F0ZShjb21tYW5kczogYW55W10sIGV4dHJhczogTmF2aWdhdGlvbkV4dHJhcyA9IHt9KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVOYXZpZ2F0aW9uKHRoaXMuY3JlYXRlVXJsVHJlZShjb21tYW5kcywgZXh0cmFzKSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlcmlhbGl6ZXMgYSB7QGxpbmsgVXJsVHJlZX0gaW50byBhIHN0cmluZy5cbiAgICovXG4gIHNlcmlhbGl6ZVVybCh1cmw6IFVybFRyZWUpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy51cmxTZXJpYWxpemVyLnNlcmlhbGl6ZSh1cmwpOyB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgc3RyaW5nIGludG8gYSB7QGxpbmsgVXJsVHJlZX0uXG4gICAqL1xuICBwYXJzZVVybCh1cmw6IHN0cmluZyk6IFVybFRyZWUgeyByZXR1cm4gdGhpcy51cmxTZXJpYWxpemVyLnBhcnNlKHVybCk7IH1cblxuICBwcml2YXRlIHNjaGVkdWxlTmF2aWdhdGlvbih1cmw6IFVybFRyZWUsIHBvcDogYm9vbGVhbik6UHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgaWQgPSArKyB0aGlzLm5hdmlnYXRpb25JZDtcbiAgICB0aGlzLnJvdXRlckV2ZW50cy5uZXh0KG5ldyBOYXZpZ2F0aW9uU3RhcnQoaWQsIHVybCkpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKChfKSA9PiB0aGlzLnJ1bk5hdmlnYXRlKHVybCwgZmFsc2UsIGlkKSk7XG4gIH1cblxuICBwcml2YXRlIHNldFVwTG9jYXRpb25DaGFuZ2VMaXN0ZW5lcigpOiB2b2lkIHtcbiAgICB0aGlzLmxvY2F0aW9uU3Vic2NyaXB0aW9uID0gPGFueT50aGlzLmxvY2F0aW9uLnN1YnNjcmliZSgoY2hhbmdlKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5zY2hlZHVsZU5hdmlnYXRpb24odGhpcy51cmxTZXJpYWxpemVyLnBhcnNlKGNoYW5nZVsndXJsJ10pLCBjaGFuZ2VbJ3BvcCddKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcnVuTmF2aWdhdGUodXJsOiBVcmxUcmVlLCBwb3A6IGJvb2xlYW4sIGlkOiBudW1iZXIpOlByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChpZCAhPT0gdGhpcy5uYXZpZ2F0aW9uSWQpIHtcbiAgICAgIHRoaXMucm91dGVyRXZlbnRzLm5leHQobmV3IE5hdmlnYXRpb25DYW5jZWwoaWQsIHVybCkpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlUHJvbWlzZSwgcmVqZWN0UHJvbWlzZSkgPT4ge1xuICAgICAgbGV0IHN0YXRlO1xuICAgICAgcmVjb2duaXplKHRoaXMucm9vdENvbXBvbmVudFR5cGUsIHRoaXMuY29uZmlnLCB1cmwpLm1lcmdlTWFwKChuZXdSb3V0ZXJTdGF0ZVNuYXBzaG90KSA9PiB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHRoaXMucmVzb2x2ZXIsIG5ld1JvdXRlclN0YXRlU25hcHNob3QpO1xuXG4gICAgICB9KS5tYXAoKHJvdXRlclN0YXRlU25hcHNob3QpID0+IHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVJvdXRlclN0YXRlKHJvdXRlclN0YXRlU25hcHNob3QsIHRoaXMuY3VycmVudFJvdXRlclN0YXRlKTtcblxuICAgICAgfSkubWFwKChuZXdTdGF0ZTpSb3V0ZXJTdGF0ZSkgPT4ge1xuICAgICAgICBzdGF0ZSA9IG5ld1N0YXRlO1xuXG4gICAgICB9KS5tZXJnZU1hcChfID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBHdWFyZENoZWNrcyhzdGF0ZS5zbmFwc2hvdCwgdGhpcy5jdXJyZW50Um91dGVyU3RhdGUuc25hcHNob3QsIHRoaXMuaW5qZWN0b3IpLmNoZWNrKHRoaXMub3V0bGV0TWFwKTtcblxuICAgICAgfSkuZm9yRWFjaCgoc2hvdWxkQWN0aXZhdGUpID0+IHtcbiAgICAgICAgaWYgKCFzaG91bGRBY3RpdmF0ZSB8fCBpZCAhPT0gdGhpcy5uYXZpZ2F0aW9uSWQpIHtcbiAgICAgICAgICB0aGlzLnJvdXRlckV2ZW50cy5uZXh0KG5ldyBOYXZpZ2F0aW9uQ2FuY2VsKGlkLCB1cmwpKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ldyBBY3RpdmF0ZVJvdXRlcyhzdGF0ZSwgdGhpcy5jdXJyZW50Um91dGVyU3RhdGUpLmFjdGl2YXRlKHRoaXMub3V0bGV0TWFwKTtcblxuICAgICAgICB0aGlzLmN1cnJlbnRVcmxUcmVlID0gdXJsO1xuICAgICAgICB0aGlzLmN1cnJlbnRSb3V0ZXJTdGF0ZSA9IHN0YXRlO1xuICAgICAgICBpZiAoIXBvcCkge1xuICAgICAgICAgIHRoaXMubG9jYXRpb24uZ28odGhpcy51cmxTZXJpYWxpemVyLnNlcmlhbGl6ZSh1cmwpKTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMucm91dGVyRXZlbnRzLm5leHQobmV3IE5hdmlnYXRpb25FbmQoaWQsIHVybCkpO1xuICAgICAgICByZXNvbHZlUHJvbWlzZSh0cnVlKTtcblxuICAgICAgfSwgZSA9PiB7XG4gICAgICAgIHRoaXMucm91dGVyRXZlbnRzLm5leHQobmV3IE5hdmlnYXRpb25FcnJvcihpZCwgdXJsLCBlKSk7XG4gICAgICAgIHJlamVjdFByb21pc2UoZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBDYW5BY3RpdmF0ZSB7IGNvbnN0cnVjdG9yKHB1YmxpYyByb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCkge319XG5jbGFzcyBDYW5EZWFjdGl2YXRlIHsgY29uc3RydWN0b3IocHVibGljIGNvbXBvbmVudDogT2JqZWN0LCBwdWJsaWMgcm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpIHt9fVxuXG5jbGFzcyBHdWFyZENoZWNrcyB7XG4gIHByaXZhdGUgY2hlY2tzID0gW107XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZnV0dXJlOiBSb3V0ZXJTdGF0ZVNuYXBzaG90LCBwcml2YXRlIGN1cnI6IFJvdXRlclN0YXRlU25hcHNob3QsIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIGNoZWNrKHBhcmVudE91dGxldE1hcDogUm91dGVyT3V0bGV0TWFwKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgY29uc3QgZnV0dXJlUm9vdCA9IHRoaXMuZnV0dXJlLl9yb290O1xuICAgIGNvbnN0IGN1cnJSb290ID0gdGhpcy5jdXJyID8gdGhpcy5jdXJyLl9yb290IDogbnVsbDtcbiAgICB0aGlzLnRyYXZlcnNlQ2hpbGRSb3V0ZXMoZnV0dXJlUm9vdCwgY3VyclJvb3QsIHBhcmVudE91dGxldE1hcCk7XG4gICAgaWYgKHRoaXMuY2hlY2tzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG9mKHRydWUpO1xuICAgIHJldHVybiBmb3JrSm9pbih0aGlzLmNoZWNrcy5tYXAocyA9PiB7XG4gICAgICBpZiAocyBpbnN0YW5jZW9mIENhbkFjdGl2YXRlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkNhbkFjdGl2YXRlKHMucm91dGUpXG4gICAgICB9IGVsc2UgaWYgKHMgaW5zdGFuY2VvZiBDYW5EZWFjdGl2YXRlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1bkNhbkRlYWN0aXZhdGUocy5jb21wb25lbnQsIHMucm91dGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGJlIHJlYWNoZWRcIik7XG4gICAgICB9XG4gICAgfSkpLm1hcChhbmQpO1xuICB9XG5cbiAgcHJpdmF0ZSB0cmF2ZXJzZUNoaWxkUm91dGVzKGZ1dHVyZU5vZGU6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlU25hcHNob3Q+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck5vZGU6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlU25hcHNob3Q+IHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dGxldE1hcDogUm91dGVyT3V0bGV0TWFwIHwgbnVsbCk6IHZvaWQge1xuICAgIGNvbnN0IHByZXZDaGlsZHJlbiA9IG5vZGVDaGlsZHJlbkFzTWFwKGN1cnJOb2RlKTtcbiAgICBmdXR1cmVOb2RlLmNoaWxkcmVuLmZvckVhY2goYyA9PiB7XG4gICAgICB0aGlzLnRyYXZlcnNlUm91dGVzKGMsIHByZXZDaGlsZHJlbltjLnZhbHVlLm91dGxldF0sIG91dGxldE1hcCk7XG4gICAgICBkZWxldGUgcHJldkNoaWxkcmVuW2MudmFsdWUub3V0bGV0XTtcbiAgICB9KTtcbiAgICBmb3JFYWNoKHByZXZDaGlsZHJlbiwgKHYsIGspID0+IHRoaXMuZGVhY3RpdmF0ZU91dGxldEFuZEl0Q2hpbGRyZW4odiwgb3V0bGV0TWFwLl9vdXRsZXRzW2tdKSk7XG4gIH1cblxuICB0cmF2ZXJzZVJvdXRlcyhmdXR1cmVOb2RlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90PiwgY3Vyck5vZGU6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlU25hcHNob3Q+IHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgcGFyZW50T3V0bGV0TWFwOiBSb3V0ZXJPdXRsZXRNYXAgfCBudWxsKTogdm9pZCB7XG4gICAgY29uc3QgZnV0dXJlID0gZnV0dXJlTm9kZS52YWx1ZTtcbiAgICBjb25zdCBjdXJyID0gY3Vyck5vZGUgPyBjdXJyTm9kZS52YWx1ZSA6IG51bGw7XG4gICAgY29uc3Qgb3V0bGV0ID0gcGFyZW50T3V0bGV0TWFwID8gcGFyZW50T3V0bGV0TWFwLl9vdXRsZXRzW2Z1dHVyZU5vZGUudmFsdWUub3V0bGV0XSA6IG51bGw7XG5cbiAgICBpZiAoY3VyciAmJiBmdXR1cmUuX3JvdXRlQ29uZmlnID09PSBjdXJyLl9yb3V0ZUNvbmZpZykge1xuICAgICAgaWYgKCFzaGFsbG93RXF1YWwoZnV0dXJlLnBhcmFtcywgY3Vyci5wYXJhbXMpKSB7XG4gICAgICAgIHRoaXMuY2hlY2tzLnB1c2gobmV3IENhbkRlYWN0aXZhdGUob3V0bGV0LmNvbXBvbmVudCwgY3VyciksIG5ldyBDYW5BY3RpdmF0ZShmdXR1cmUpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudHJhdmVyc2VDaGlsZFJvdXRlcyhmdXR1cmVOb2RlLCBjdXJyTm9kZSwgb3V0bGV0ID8gb3V0bGV0Lm91dGxldE1hcCA6IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlYWN0aXZhdGVPdXRsZXRBbmRJdENoaWxkcmVuKGN1cnIsIG91dGxldCk7XG4gICAgICB0aGlzLmNoZWNrcy5wdXNoKG5ldyBDYW5BY3RpdmF0ZShmdXR1cmUpKTtcbiAgICAgIHRoaXMudHJhdmVyc2VDaGlsZFJvdXRlcyhmdXR1cmVOb2RlLCBudWxsLCBvdXRsZXQgPyBvdXRsZXQub3V0bGV0TWFwIDogbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBkZWFjdGl2YXRlT3V0bGV0QW5kSXRDaGlsZHJlbihyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgb3V0bGV0OiBSb3V0ZXJPdXRsZXQpOiB2b2lkIHtcbiAgICBpZiAob3V0bGV0ICYmIG91dGxldC5pc0FjdGl2YXRlZCkge1xuICAgICAgZm9yRWFjaChvdXRsZXQub3V0bGV0TWFwLl9vdXRsZXRzLCAodiwgaykgPT4gdGhpcy5kZWFjdGl2YXRlT3V0bGV0QW5kSXRDaGlsZHJlbih2LCBvdXRsZXQub3V0bGV0TWFwLl9vdXRsZXRzW2tdKSk7XG4gICAgICB0aGlzLmNoZWNrcy5wdXNoKG5ldyBDYW5EZWFjdGl2YXRlKG91dGxldC5jb21wb25lbnQsIHJvdXRlKSlcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJ1bkNhbkFjdGl2YXRlKGZ1dHVyZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGNhbkFjdGl2YXRlID0gZnV0dXJlLl9yb3V0ZUNvbmZpZyA/IGZ1dHVyZS5fcm91dGVDb25maWcuY2FuQWN0aXZhdGUgOiBudWxsO1xuICAgIGlmICghY2FuQWN0aXZhdGUgfHwgY2FuQWN0aXZhdGUubGVuZ3RoID09PSAwKSByZXR1cm4gb2YodHJ1ZSk7XG4gICAgcmV0dXJuIGZvcmtKb2luKGNhbkFjdGl2YXRlLm1hcChjID0+IHtcbiAgICAgIGNvbnN0IGd1YXJkID0gdGhpcy5pbmplY3Rvci5nZXQoYyk7XG4gICAgICBpZiAoZ3VhcmQuY2FuQWN0aXZhdGUpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBJbnRvT2JzZXJ2YWJsZShndWFyZC5jYW5BY3RpdmF0ZShmdXR1cmUsIHRoaXMuZnV0dXJlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gd3JhcEludG9PYnNlcnZhYmxlKGd1YXJkKGZ1dHVyZSwgdGhpcy5mdXR1cmUpKTtcbiAgICAgIH1cbiAgICB9KSkubWFwKGFuZCk7XG4gIH1cblxuICBwcml2YXRlIHJ1bkNhbkRlYWN0aXZhdGUoY29tcG9uZW50OiBPYmplY3QsIGN1cnI6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBjYW5EZWFjdGl2YXRlID0gY3Vyci5fcm91dGVDb25maWcgPyBjdXJyLl9yb3V0ZUNvbmZpZy5jYW5EZWFjdGl2YXRlIDogbnVsbDtcbiAgICBpZiAoIWNhbkRlYWN0aXZhdGUgfHwgY2FuRGVhY3RpdmF0ZS5sZW5ndGggPT09IDApIHJldHVybiBvZih0cnVlKTtcbiAgICByZXR1cm4gZm9ya0pvaW4oY2FuRGVhY3RpdmF0ZS5tYXAoYyA9PiB7XG4gICAgICBjb25zdCBndWFyZCA9IHRoaXMuaW5qZWN0b3IuZ2V0KGMpO1xuICAgICAgaWYgKGd1YXJkLmNhbkRlYWN0aXZhdGUpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBJbnRvT2JzZXJ2YWJsZShndWFyZC5jYW5EZWFjdGl2YXRlKGNvbXBvbmVudCwgY3VyciwgdGhpcy5jdXJyKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gd3JhcEludG9PYnNlcnZhYmxlKGd1YXJkKGNvbXBvbmVudCwgY3VyciwgdGhpcy5jdXJyKSk7XG4gICAgICB9XG4gICAgfSkpLm1hcChhbmQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyYXBJbnRvT2JzZXJ2YWJsZTxUPih2YWx1ZTogVCB8IE9ic2VydmFibGU8VD4pOiBPYnNlcnZhYmxlPFQ+IHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgT2JzZXJ2YWJsZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2YodmFsdWUpO1xuICB9XG59XG5cbmNsYXNzIEFjdGl2YXRlUm91dGVzIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBmdXR1cmVTdGF0ZTogUm91dGVyU3RhdGUsIHByaXZhdGUgY3VyclN0YXRlOiBSb3V0ZXJTdGF0ZSkge31cblxuICBhY3RpdmF0ZShwYXJlbnRPdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCk6dm9pZCB7XG4gICAgY29uc3QgZnV0dXJlUm9vdCA9IHRoaXMuZnV0dXJlU3RhdGUuX3Jvb3Q7XG4gICAgY29uc3QgY3VyclJvb3QgPSB0aGlzLmN1cnJTdGF0ZSA/IHRoaXMuY3VyclN0YXRlLl9yb290IDogbnVsbDtcblxuICAgIHB1c2hRdWVyeVBhcmFtc0FuZEZyYWdtZW50KHRoaXMuZnV0dXJlU3RhdGUpO1xuICAgIHRoaXMuYWN0aXZhdGVDaGlsZFJvdXRlcyhmdXR1cmVSb290LCBjdXJyUm9vdCwgcGFyZW50T3V0bGV0TWFwKTtcbiAgfVxuXG4gIHByaXZhdGUgYWN0aXZhdGVDaGlsZFJvdXRlcyhmdXR1cmVOb2RlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZT4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyTm9kZTogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGU+IHwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dGxldE1hcDogUm91dGVyT3V0bGV0TWFwKTogdm9pZCB7XG4gICAgY29uc3QgcHJldkNoaWxkcmVuID0gbm9kZUNoaWxkcmVuQXNNYXAoY3Vyck5vZGUpO1xuICAgIGZ1dHVyZU5vZGUuY2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAgIHRoaXMuYWN0aXZhdGVSb3V0ZXMoYywgcHJldkNoaWxkcmVuW2MudmFsdWUub3V0bGV0XSwgb3V0bGV0TWFwKTtcbiAgICAgIGRlbGV0ZSBwcmV2Q2hpbGRyZW5bYy52YWx1ZS5vdXRsZXRdO1xuICAgIH0pO1xuICAgIGZvckVhY2gocHJldkNoaWxkcmVuLCAodiwgaykgPT4gdGhpcy5kZWFjdGl2YXRlT3V0bGV0QW5kSXRDaGlsZHJlbihvdXRsZXRNYXAuX291dGxldHNba10pKTtcbiAgfVxuXG4gIGFjdGl2YXRlUm91dGVzKGZ1dHVyZU5vZGU6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlPiwgY3Vyck5vZGU6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlPiB8IG51bGwsXG4gICAgICAgICAgICAgICAgIHBhcmVudE91dGxldE1hcDogUm91dGVyT3V0bGV0TWFwKTogdm9pZCB7XG4gICAgY29uc3QgZnV0dXJlID0gZnV0dXJlTm9kZS52YWx1ZTtcbiAgICBjb25zdCBjdXJyID0gY3Vyck5vZGUgPyBjdXJyTm9kZS52YWx1ZSA6IG51bGw7XG4gICAgY29uc3Qgb3V0bGV0ID0gZ2V0T3V0bGV0KHBhcmVudE91dGxldE1hcCwgZnV0dXJlTm9kZS52YWx1ZSk7XG5cbiAgICBpZiAoZnV0dXJlID09PSBjdXJyKSB7XG4gICAgICBhZHZhbmNlQWN0aXZhdGVkUm91dGUoZnV0dXJlKTtcbiAgICAgIHRoaXMuYWN0aXZhdGVDaGlsZFJvdXRlcyhmdXR1cmVOb2RlLCBjdXJyTm9kZSwgb3V0bGV0Lm91dGxldE1hcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVhY3RpdmF0ZU91dGxldEFuZEl0Q2hpbGRyZW4ob3V0bGV0KTtcbiAgICAgIGNvbnN0IG91dGxldE1hcCA9IG5ldyBSb3V0ZXJPdXRsZXRNYXAoKTtcbiAgICAgIHRoaXMuYWN0aXZhdGVOZXdSb3V0ZXMob3V0bGV0TWFwLCBmdXR1cmUsIG91dGxldCk7XG4gICAgICB0aGlzLmFjdGl2YXRlQ2hpbGRSb3V0ZXMoZnV0dXJlTm9kZSwgbnVsbCwgb3V0bGV0TWFwKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFjdGl2YXRlTmV3Um91dGVzKG91dGxldE1hcDogUm91dGVyT3V0bGV0TWFwLCBmdXR1cmU6IEFjdGl2YXRlZFJvdXRlLCBvdXRsZXQ6IFJvdXRlck91dGxldCk6IHZvaWQge1xuICAgIGNvbnN0IHJlc29sdmVkID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW1xuICAgICAge3Byb3ZpZGU6IEFjdGl2YXRlZFJvdXRlLCB1c2VWYWx1ZTogZnV0dXJlfSxcbiAgICAgIHtwcm92aWRlOiBSb3V0ZXJPdXRsZXRNYXAsIHVzZVZhbHVlOiBvdXRsZXRNYXB9XG4gICAgXSk7XG4gICAgb3V0bGV0LmFjdGl2YXRlKGZ1dHVyZS5fZnV0dXJlU25hcHNob3QuX3Jlc29sdmVkQ29tcG9uZW50RmFjdG9yeSwgcmVzb2x2ZWQsIG91dGxldE1hcCk7XG4gICAgYWR2YW5jZUFjdGl2YXRlZFJvdXRlKGZ1dHVyZSk7XG4gIH1cblxuICBwcml2YXRlIGRlYWN0aXZhdGVPdXRsZXRBbmRJdENoaWxkcmVuKG91dGxldDogUm91dGVyT3V0bGV0KTogdm9pZCB7XG4gICAgaWYgKG91dGxldCAmJiBvdXRsZXQuaXNBY3RpdmF0ZWQpIHtcbiAgICAgIGZvckVhY2gob3V0bGV0Lm91dGxldE1hcC5fb3V0bGV0cywgKHYsIGspID0+IHRoaXMuZGVhY3RpdmF0ZU91dGxldEFuZEl0Q2hpbGRyZW4odikpO1xuICAgICAgb3V0bGV0LmRlYWN0aXZhdGUoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcHVzaFF1ZXJ5UGFyYW1zQW5kRnJhZ21lbnQoc3RhdGU6IFJvdXRlclN0YXRlKTogdm9pZCB7XG4gIGlmICghc2hhbGxvd0VxdWFsKHN0YXRlLnNuYXBzaG90LnF1ZXJ5UGFyYW1zLCAoPGFueT5zdGF0ZS5xdWVyeVBhcmFtcykudmFsdWUpKSB7XG4gICAgKDxhbnk+c3RhdGUucXVlcnlQYXJhbXMpLm5leHQoc3RhdGUuc25hcHNob3QucXVlcnlQYXJhbXMpO1xuICB9XG5cbiAgaWYgKHN0YXRlLnNuYXBzaG90LmZyYWdtZW50ICE9PSAoPGFueT5zdGF0ZS5mcmFnbWVudCkudmFsdWUpIHtcbiAgICAoPGFueT5zdGF0ZS5mcmFnbWVudCkubmV4dChzdGF0ZS5zbmFwc2hvdC5mcmFnbWVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9kZUNoaWxkcmVuQXNNYXAobm9kZTogVHJlZU5vZGU8YW55PnxudWxsKSB7XG4gIHJldHVybiBub2RlID9cbiAgICBub2RlLmNoaWxkcmVuLnJlZHVjZShcbiAgICAgIChtLCBjKSA9PiB7XG4gICAgICAgIG1bYy52YWx1ZS5vdXRsZXRdID0gYztcbiAgICAgICAgcmV0dXJuIG07XG4gICAgICB9LFxuICAgICAge30pIDpcbiAge307XG59XG5cbmZ1bmN0aW9uIGdldE91dGxldChvdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCwgcm91dGU6IEFjdGl2YXRlZFJvdXRlKTogUm91dGVyT3V0bGV0IHtcbiAgbGV0IG91dGxldCA9IG91dGxldE1hcC5fb3V0bGV0c1tyb3V0ZS5vdXRsZXRdO1xuICBpZiAoIW91dGxldCkge1xuICAgIGlmIChyb3V0ZS5vdXRsZXQgPT09IFBSSU1BUllfT1VUTEVUKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kIHByaW1hcnkgb3V0bGV0YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGZpbmQgdGhlIG91dGxldCAke3JvdXRlLm91dGxldH1gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dGxldDtcbn1cbiJdfQ==