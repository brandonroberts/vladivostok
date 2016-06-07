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
        this.currentRouterState = router_state_1.createEmptyState(this.rootComponentType);
    }
    Router.prototype.initialNavigation = function () {
        this.setUpLocationChangeListener();
        this.navigateByUrl(this.location.path());
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXNFLGVBQWUsQ0FBQyxDQUFBO0FBR3RGLGtDQUFnQyxxQkFBcUIsQ0FBQyxDQUFBO0FBQ3RELDBCQUEwQixhQUFhLENBQUMsQ0FBQTtBQUN4Qyx3QkFBd0IsV0FBVyxDQUFDLENBQUE7QUFDcEMsb0NBQWtDLHVCQUF1QixDQUFDLENBQUE7QUFFMUQseUJBQTRDLFlBQVksQ0FBQyxDQUFBO0FBQ3pELHVCQUF1QyxVQUFVLENBQUMsQ0FBQTtBQUNsRCw2QkFBaUksZ0JBQWdCLENBQUMsQ0FBQTtBQUdsSixnQ0FBOEIsbUJBQW1CLENBQUMsQ0FBQTtBQUNsRCwyQkFBMkMsb0JBQW9CLENBQUMsQ0FBQTtBQUNoRSwyQkFBMkIsaUJBQWlCLENBQUMsQ0FBQTtBQUU3Qyx3QkFBd0IsY0FBYyxDQUFDLENBQUE7QUFDdkMsUUFBTyx1QkFBdUIsQ0FBQyxDQUFBO0FBQy9CLFFBQU8sd0JBQXdCLENBQUMsQ0FBQTtBQUNoQyxRQUFPLDRCQUE0QixDQUFDLENBQUE7QUFDcEMsUUFBTywwQkFBMEIsQ0FBQyxDQUFBO0FBQ2xDLFFBQU8sNkJBQTZCLENBQUMsQ0FBQTtBQUNyQyxtQkFBaUIsb0JBQW9CLENBQUMsQ0FBQTtBQUN0Qyx5QkFBdUIsMEJBQTBCLENBQUMsQ0FBQTtBQU9sRDtJQUErQix5QkFBbUIsRUFBUyxFQUFTLEdBQVc7UUFBN0IsT0FBRSxHQUFGLEVBQUUsQ0FBTztRQUFTLFFBQUcsR0FBSCxHQUFHLENBQVE7SUFBRyxDQUFDO0lBQUMsc0JBQUM7QUFBRCxDQUFDLEFBQXJGLElBQXFGO0FBQXhFLHVCQUFlLGtCQUF5RCxDQUFBO0FBS3JGO0lBQTZCLHVCQUFtQixFQUFTLEVBQVMsR0FBVztRQUE3QixPQUFFLEdBQUYsRUFBRSxDQUFPO1FBQVMsUUFBRyxHQUFILEdBQUcsQ0FBUTtJQUFHLENBQUM7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QUM7SUFDdEQsQ0FBQztBQUNILENBQUM7QUFFRCwyQkFBMkIsSUFBd0I7SUFDakQsTUFBTSxDQUFDLElBQUk7UUFDVCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FDbEIsVUFBQyxDQUFDLEVBQUUsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxFQUNELEVBQUUsQ0FBQztRQUNQLEVBQUUsQ0FBQztBQUNMLENBQUM7QUFFRCxtQkFBbUIsU0FBMEIsRUFBRSxLQUFxQjtJQUNsRSxJQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5QyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDWixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLHVCQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUEwQixLQUFLLENBQUMsTUFBUSxDQUFDLENBQUM7UUFDNUQsQ0FBQztJQUNILENBQUM7SUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnRSZXNvbHZlciwgUmVmbGVjdGl2ZUluamVjdG9yLCBUeXBlLCBJbmplY3RvciB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTG9jYXRpb24gfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgVXJsU2VyaWFsaXplciB9IGZyb20gJy4vdXJsX3NlcmlhbGl6ZXInO1xuaW1wb3J0IHsgUm91dGVyT3V0bGV0TWFwIH0gZnJvbSAnLi9yb3V0ZXJfb3V0bGV0X21hcCc7XG5pbXBvcnQgeyByZWNvZ25pemUgfSBmcm9tICcuL3JlY29nbml6ZSc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnLi9yZXNvbHZlJztcbmltcG9ydCB7IGNyZWF0ZVJvdXRlclN0YXRlIH0gZnJvbSAnLi9jcmVhdGVfcm91dGVyX3N0YXRlJztcbmltcG9ydCB7IFRyZWVOb2RlIH0gZnJvbSAnLi91dGlscy90cmVlJztcbmltcG9ydCB7IFVybFRyZWUsIGNyZWF0ZUVtcHR5VXJsVHJlZSB9IGZyb20gJy4vdXJsX3RyZWUnO1xuaW1wb3J0IHsgUFJJTUFSWV9PVVRMRVQsIFBhcmFtcyB9IGZyb20gJy4vc2hhcmVkJztcbmltcG9ydCB7IGNyZWF0ZUVtcHR5U3RhdGUsIFJvdXRlclN0YXRlLCBSb3V0ZXJTdGF0ZVNuYXBzaG90LCBBY3RpdmF0ZWRSb3V0ZSwgQWN0aXZhdGVkUm91dGVTbmFwc2hvdCwgYWR2YW5jZUFjdGl2YXRlZFJvdXRlfSBmcm9tICcuL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQgeyBSb3V0ZXJDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBSb3V0ZXJPdXRsZXQgfSBmcm9tICcuL2RpcmVjdGl2ZXMvcm91dGVyX291dGxldCc7XG5pbXBvcnQgeyBjcmVhdGVVcmxUcmVlIH0gZnJvbSAnLi9jcmVhdGVfdXJsX3RyZWUnO1xuaW1wb3J0IHsgZm9yRWFjaCwgYW5kLCBzaGFsbG93RXF1YWwgfSBmcm9tICcuL3V0aWxzL2NvbGxlY3Rpb24nO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gJ3J4anMvT2JzZXJ2YWJsZSc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzL1N1YnNjcmlwdGlvbic7XG5pbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSAncnhqcy9TdWJqZWN0JztcbmltcG9ydCAncnhqcy9hZGQvb3BlcmF0b3IvbWFwJztcbmltcG9ydCAncnhqcy9hZGQvb3BlcmF0b3Ivc2Nhbic7XG5pbXBvcnQgJ3J4anMvYWRkL29wZXJhdG9yL21lcmdlTWFwJztcbmltcG9ydCAncnhqcy9hZGQvb3BlcmF0b3IvY29uY2F0JztcbmltcG9ydCAncnhqcy9hZGQvb3BlcmF0b3IvY29uY2F0TWFwJztcbmltcG9ydCB7b2Z9IGZyb20gJ3J4anMvb2JzZXJ2YWJsZS9vZic7XG5pbXBvcnQge2ZvcmtKb2lufSBmcm9tICdyeGpzL29ic2VydmFibGUvZm9ya0pvaW4nO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5hdmlnYXRpb25FeHRyYXMgeyByZWxhdGl2ZVRvPzogQWN0aXZhdGVkUm91dGU7IHF1ZXJ5UGFyYW1zPzogUGFyYW1zOyBmcmFnbWVudD86IHN0cmluZzsgfVxuXG4vKipcbiAqIEFuIGV2ZW50IHRyaWdnZXJlZCB3aGVuIGEgbmF2aWdhdGlvbiBzdGFydHNcbiAqL1xuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb25TdGFydCB7IGNvbnN0cnVjdG9yKHB1YmxpYyBpZDpudW1iZXIsIHB1YmxpYyB1cmw6VXJsVHJlZSkge30gfVxuXG4vKipcbiAqIEFuIGV2ZW50IHRyaWdnZXJlZCB3aGVuIGEgbmF2aWdhdGlvbiBlbmRzIHN1Y2Nlc3NmdWxseVxuICovXG5leHBvcnQgY2xhc3MgTmF2aWdhdGlvbkVuZCB7IGNvbnN0cnVjdG9yKHB1YmxpYyBpZDpudW1iZXIsIHB1YmxpYyB1cmw6VXJsVHJlZSkge30gfVxuXG4vKipcbiAqIEFuIGV2ZW50IHRyaWdnZXJlZCB3aGVuIGEgbmF2aWdhdGlvbiBpcyBjYW5jZWxlZFxuICovXG5leHBvcnQgY2xhc3MgTmF2aWdhdGlvbkNhbmNlbCB7IGNvbnN0cnVjdG9yKHB1YmxpYyBpZDpudW1iZXIsIHB1YmxpYyB1cmw6VXJsVHJlZSkge30gfVxuXG4vKipcbiAqIEFuIGV2ZW50IHRyaWdnZXJlZCB3aGVuIGEgbmF2aWdhdGlvbiBmYWlscyBkdWUgdG8gdW5leHBlY3RlZCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgTmF2aWdhdGlvbkVycm9yIHsgY29uc3RydWN0b3IocHVibGljIGlkOm51bWJlciwgcHVibGljIHVybDpVcmxUcmVlLCBwdWJsaWMgZXJyb3I6YW55KSB7fSB9XG5cbmV4cG9ydCB0eXBlIEV2ZW50ID0gTmF2aWdhdGlvblN0YXJ0IHwgTmF2aWdhdGlvbkVuZCB8IE5hdmlnYXRpb25DYW5jZWwgfCBOYXZpZ2F0aW9uRXJyb3I7XG5cbi8qKlxuICogVGhlIGBSb3V0ZXJgIGlzIHJlc3BvbnNpYmxlIGZvciBtYXBwaW5nIFVSTHMgdG8gY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJvdXRlciB7XG4gIHByaXZhdGUgY3VycmVudFVybFRyZWU6IFVybFRyZWU7XG4gIHByaXZhdGUgY3VycmVudFJvdXRlclN0YXRlOiBSb3V0ZXJTdGF0ZTtcbiAgcHJpdmF0ZSBsb2NhdGlvblN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBwcml2YXRlIHJvdXRlckV2ZW50czogU3ViamVjdDxFdmVudD47XG4gIHByaXZhdGUgbmF2aWdhdGlvbklkOiBudW1iZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdENvbXBvbmVudFR5cGU6VHlwZSwgcHJpdmF0ZSByZXNvbHZlcjogQ29tcG9uZW50UmVzb2x2ZXIsIHByaXZhdGUgdXJsU2VyaWFsaXplcjogVXJsU2VyaWFsaXplciwgcHJpdmF0ZSBvdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCwgcHJpdmF0ZSBsb2NhdGlvbjogTG9jYXRpb24sIHByaXZhdGUgaW5qZWN0b3I6IEluamVjdG9yLCBwcml2YXRlIGNvbmZpZzogUm91dGVyQ29uZmlnKSB7XG4gICAgdGhpcy5yb3V0ZXJFdmVudHMgPSBuZXcgU3ViamVjdDxFdmVudD4oKTtcbiAgICB0aGlzLmN1cnJlbnRVcmxUcmVlID0gY3JlYXRlRW1wdHlVcmxUcmVlKClcbiAgICB0aGlzLmN1cnJlbnRSb3V0ZXJTdGF0ZSA9IGNyZWF0ZUVtcHR5U3RhdGUodGhpcy5yb290Q29tcG9uZW50VHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBpbml0aWFsTmF2aWdhdGlvbigpOnZvaWQge1xuICAgIHRoaXMuc2V0VXBMb2NhdGlvbkNoYW5nZUxpc3RlbmVyKCk7XG4gICAgdGhpcy5uYXZpZ2F0ZUJ5VXJsKHRoaXMubG9jYXRpb24ucGF0aCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHJvdXRlIHN0YXRlLlxuICAgKi9cbiAgZ2V0IHJvdXRlclN0YXRlKCk6IFJvdXRlclN0YXRlIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50Um91dGVyU3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCB1cmwgdHJlZS5cbiAgICovXG4gIGdldCB1cmxUcmVlKCk6IFVybFRyZWUge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRVcmxUcmVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JzZXJ2YWJsZSBvZiByb3V0ZSBldmVudHNcbiAgICovXG4gIGdldCBldmVudHMoKTogT2JzZXJ2YWJsZTxFdmVudD4ge1xuICAgIHJldHVybiB0aGlzLnJvdXRlckV2ZW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBOYXZpZ2F0ZSBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgdXJsLiBUaGlzIG5hdmlnYXRpb24gaXMgYWx3YXlzIGFic29sdXRlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0OlxuICAgKiAtIGlzIHJlc29sdmVkIHdpdGggJ3RydWUnIHdoZW4gbmF2aWdhdGlvbiBzdWNjZWVkc1xuICAgKiAtIGlzIHJlc29sdmVkIHdpdGggJ2ZhbHNlJyB3aGVuIG5hdmlnYXRpb24gZmFpbHNcbiAgICogLSBpcyByZWplY3RlZCB3aGVuIGFuIGVycm9yIGhhcHBlbnNcbiAgICpcbiAgICogIyMjIFVzYWdlXG4gICAqXG4gICAqIGBgYFxuICAgKiByb3V0ZXIubmF2aWdhdGVCeVVybChcIi90ZWFtLzMzL3VzZXIvMTFcIik7XG4gICAqIGBgYFxuICAgKi9cbiAgbmF2aWdhdGVCeVVybCh1cmw6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHVybFRyZWUgPSB0aGlzLnVybFNlcmlhbGl6ZXIucGFyc2UodXJsKTtcbiAgICByZXR1cm4gdGhpcy5zY2hlZHVsZU5hdmlnYXRpb24odXJsVHJlZSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgY29uZmlndXJhdGlvbiB1c2VkIGZvciBuYXZpZ2F0aW9uIGFuZCBnZW5lcmF0aW5nIGxpbmtzLlxuICAgKlxuICAgKiAjIyMgVXNhZ2VcbiAgICpcbiAgICogYGBgXG4gICAqIHJvdXRlci5yZXNldENvbmZpZyhbXG4gICAqICB7IHBhdGg6ICd0ZWFtLzppZCcsIGNvbXBvbmVudDogVGVhbUNtcCwgY2hpbGRyZW46IFtcbiAgICogICAgeyBwYXRoOiAnc2ltcGxlJywgY29tcG9uZW50OiBTaW1wbGVDbXAgfSxcbiAgICogICAgeyBwYXRoOiAndXNlci86bmFtZScsIGNvbXBvbmVudDogVXNlckNtcCB9XG4gICAqICBdIH1cbiAgICogXSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcmVzZXRDb25maWcoY29uZmlnOiBSb3V0ZXJDb25maWcpOiB2b2lkIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGRpc3Bvc2UoKTogdm9pZCB7IHRoaXMubG9jYXRpb25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTsgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGFuIGFycmF5IG9mIGNvbW1hbmRzIHRvIHRoZSBjdXJyZW50IHVybCB0cmVlIGFuZCBjcmVhdGVzXG4gICAqIGEgbmV3IHVybCB0cmVlLlxuICAgKlxuICAgKiBXaGVuIGdpdmVuIGFuIGFjdGl2YXRlIHJvdXRlLCBhcHBsaWVzIHRoZSBnaXZlbiBjb21tYW5kcyBzdGFydGluZyBmcm9tIHRoZSByb3V0ZS5cbiAgICogV2hlbiBub3QgZ2l2ZW4gYSByb3V0ZSwgYXBwbGllcyB0aGUgZ2l2ZW4gY29tbWFuZCBzdGFydGluZyBmcm9tIHRoZSByb290LlxuICAgKlxuICAgKiAjIyMgVXNhZ2VcbiAgICpcbiAgICogYGBgXG4gICAqIC8vIGNyZWF0ZSAvdGVhbS8zMy91c2VyLzExXG4gICAqIHJvdXRlci5jcmVhdGVVcmxUcmVlKFsnL3RlYW0nLCAzMywgJ3VzZXInLCAxMV0pO1xuICAgKlxuICAgKiAvLyBjcmVhdGUgL3RlYW0vMzM7ZXhwYW5kPXRydWUvdXNlci8xMVxuICAgKiByb3V0ZXIuY3JlYXRlVXJsVHJlZShbJy90ZWFtJywgMzMsIHtleHBhbmQ6IHRydWV9LCAndXNlcicsIDExXSk7XG4gICAqXG4gICAqIC8vIHlvdSBjYW4gY29sbGFwc2Ugc3RhdGljIGZyYWdtZW50cyBsaWtlIHRoaXNcbiAgICogcm91dGVyLmNyZWF0ZVVybFRyZWUoWycvdGVhbS8zMy91c2VyJywgdXNlcklkXSk7XG4gICAqXG4gICAqIC8vIGFzc3VtaW5nIHRoZSBjdXJyZW50IHVybCBpcyBgL3RlYW0vMzMvdXNlci8xMWAgYW5kIHRoZSByb3V0ZSBwb2ludHMgdG8gYHVzZXIvMTFgXG4gICAqXG4gICAqIC8vIG5hdmlnYXRlIHRvIC90ZWFtLzMzL3VzZXIvMTEvZGV0YWlsc1xuICAgKiByb3V0ZXIuY3JlYXRlVXJsVHJlZShbJ2RldGFpbHMnXSwge3JlbGF0aXZlVG86IHJvdXRlfSk7XG4gICAqXG4gICAqIC8vIG5hdmlnYXRlIHRvIC90ZWFtLzMzL3VzZXIvMjJcbiAgICogcm91dGVyLmNyZWF0ZVVybFRyZWUoWycuLi8yMiddLCB7cmVsYXRpdmVUbzogcm91dGV9KTtcbiAgICpcbiAgICogLy8gbmF2aWdhdGUgdG8gL3RlYW0vNDQvdXNlci8yMlxuICAgKiByb3V0ZXIuY3JlYXRlVXJsVHJlZShbJy4uLy4uL3RlYW0vNDQvdXNlci8yMiddLCB7cmVsYXRpdmVUbzogcm91dGV9KTtcbiAgICogYGBgXG4gICAqL1xuICBjcmVhdGVVcmxUcmVlKGNvbW1hbmRzOiBhbnlbXSwge3JlbGF0aXZlVG8sIHF1ZXJ5UGFyYW1zLCBmcmFnbWVudH06IE5hdmlnYXRpb25FeHRyYXMgPSB7fSk6IFVybFRyZWUge1xuICAgIGNvbnN0IGEgPSByZWxhdGl2ZVRvID8gcmVsYXRpdmVUbyA6IHRoaXMucm91dGVyU3RhdGUucm9vdDtcbiAgICByZXR1cm4gY3JlYXRlVXJsVHJlZShhLCB0aGlzLmN1cnJlbnRVcmxUcmVlLCBjb21tYW5kcywgcXVlcnlQYXJhbXMsIGZyYWdtZW50KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIE5hdmlnYXRlIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBhcnJheSBvZiBjb21tYW5kcyBhbmQgYSBzdGFydGluZyBwb2ludC5cbiAgICogSWYgbm8gc3RhcnRpbmcgcm91dGUgaXMgcHJvdmlkZWQsIHRoZSBuYXZpZ2F0aW9uIGlzIGFic29sdXRlLlxuICAgKlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0OlxuICAgKiAtIGlzIHJlc29sdmVkIHdpdGggJ3RydWUnIHdoZW4gbmF2aWdhdGlvbiBzdWNjZWVkc1xuICAgKiAtIGlzIHJlc29sdmVkIHdpdGggJ2ZhbHNlJyB3aGVuIG5hdmlnYXRpb24gZmFpbHNcbiAgICogLSBpcyByZWplY3RlZCB3aGVuIGFuIGVycm9yIGhhcHBlbnNcbiAgICpcbiAgICogIyMjIFVzYWdlXG4gICAqXG4gICAqIGBgYFxuICAgKiByb3V0ZXIubmF2aWdhdGUoWyd0ZWFtJywgMzMsICd0ZWFtJywgJzExXSwge3JlbGF0aXZlVG86IHJvdXRlfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgbmF2aWdhdGUoY29tbWFuZHM6IGFueVtdLCBleHRyYXM6IE5hdmlnYXRpb25FeHRyYXMgPSB7fSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLnNjaGVkdWxlTmF2aWdhdGlvbih0aGlzLmNyZWF0ZVVybFRyZWUoY29tbWFuZHMsIGV4dHJhcyksIGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXJpYWxpemVzIGEge0BsaW5rIFVybFRyZWV9IGludG8gYSBzdHJpbmcuXG4gICAqL1xuICBzZXJpYWxpemVVcmwodXJsOiBVcmxUcmVlKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMudXJsU2VyaWFsaXplci5zZXJpYWxpemUodXJsKTsgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBhIHN0cmluZyBpbnRvIGEge0BsaW5rIFVybFRyZWV9LlxuICAgKi9cbiAgcGFyc2VVcmwodXJsOiBzdHJpbmcpOiBVcmxUcmVlIHsgcmV0dXJuIHRoaXMudXJsU2VyaWFsaXplci5wYXJzZSh1cmwpOyB9XG5cbiAgcHJpdmF0ZSBzY2hlZHVsZU5hdmlnYXRpb24odXJsOiBVcmxUcmVlLCBwb3A6IGJvb2xlYW4pOlByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGlkID0gKysgdGhpcy5uYXZpZ2F0aW9uSWQ7XG4gICAgdGhpcy5yb3V0ZXJFdmVudHMubmV4dChuZXcgTmF2aWdhdGlvblN0YXJ0KGlkLCB1cmwpKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoXykgPT4gdGhpcy5ydW5OYXZpZ2F0ZSh1cmwsIGZhbHNlLCBpZCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRVcExvY2F0aW9uQ2hhbmdlTGlzdGVuZXIoKTogdm9pZCB7XG4gICAgdGhpcy5sb2NhdGlvblN1YnNjcmlwdGlvbiA9IDxhbnk+dGhpcy5sb2NhdGlvbi5zdWJzY3JpYmUoKGNoYW5nZSkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuc2NoZWR1bGVOYXZpZ2F0aW9uKHRoaXMudXJsU2VyaWFsaXplci5wYXJzZShjaGFuZ2VbJ3VybCddKSwgY2hhbmdlWydwb3AnXSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJ1bk5hdmlnYXRlKHVybDogVXJsVHJlZSwgcG9wOiBib29sZWFuLCBpZDogbnVtYmVyKTpQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoaWQgIT09IHRoaXMubmF2aWdhdGlvbklkKSB7XG4gICAgICB0aGlzLnJvdXRlckV2ZW50cy5uZXh0KG5ldyBOYXZpZ2F0aW9uQ2FuY2VsKGlkLCB1cmwpKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZVByb21pc2UsIHJlamVjdFByb21pc2UpID0+IHtcbiAgICAgIGxldCBzdGF0ZTtcbiAgICAgIHJlY29nbml6ZSh0aGlzLnJvb3RDb21wb25lbnRUeXBlLCB0aGlzLmNvbmZpZywgdXJsKS5tZXJnZU1hcCgobmV3Um91dGVyU3RhdGVTbmFwc2hvdCkgPT4ge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh0aGlzLnJlc29sdmVyLCBuZXdSb3V0ZXJTdGF0ZVNuYXBzaG90KTtcblxuICAgICAgfSkubWFwKChyb3V0ZXJTdGF0ZVNuYXBzaG90KSA9PiB7XG4gICAgICAgIHJldHVybiBjcmVhdGVSb3V0ZXJTdGF0ZShyb3V0ZXJTdGF0ZVNuYXBzaG90LCB0aGlzLmN1cnJlbnRSb3V0ZXJTdGF0ZSk7XG5cbiAgICAgIH0pLm1hcCgobmV3U3RhdGU6Um91dGVyU3RhdGUpID0+IHtcbiAgICAgICAgc3RhdGUgPSBuZXdTdGF0ZTtcblxuICAgICAgfSkubWVyZ2VNYXAoXyA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgR3VhcmRDaGVja3Moc3RhdGUuc25hcHNob3QsIHRoaXMuY3VycmVudFJvdXRlclN0YXRlLnNuYXBzaG90LCB0aGlzLmluamVjdG9yKS5jaGVjayh0aGlzLm91dGxldE1hcCk7XG5cbiAgICAgIH0pLmZvckVhY2goKHNob3VsZEFjdGl2YXRlKSA9PiB7XG4gICAgICAgIGlmICghc2hvdWxkQWN0aXZhdGUgfHwgaWQgIT09IHRoaXMubmF2aWdhdGlvbklkKSB7XG4gICAgICAgICAgdGhpcy5yb3V0ZXJFdmVudHMubmV4dChuZXcgTmF2aWdhdGlvbkNhbmNlbChpZCwgdXJsKSk7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG4gICAgICAgIH1cblxuICAgICAgICBuZXcgQWN0aXZhdGVSb3V0ZXMoc3RhdGUsIHRoaXMuY3VycmVudFJvdXRlclN0YXRlKS5hY3RpdmF0ZSh0aGlzLm91dGxldE1hcCk7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50VXJsVHJlZSA9IHVybDtcbiAgICAgICAgdGhpcy5jdXJyZW50Um91dGVyU3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgaWYgKCFwb3ApIHtcbiAgICAgICAgICB0aGlzLmxvY2F0aW9uLmdvKHRoaXMudXJsU2VyaWFsaXplci5zZXJpYWxpemUodXJsKSk7XG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJvdXRlckV2ZW50cy5uZXh0KG5ldyBOYXZpZ2F0aW9uRW5kKGlkLCB1cmwpKTtcbiAgICAgICAgcmVzb2x2ZVByb21pc2UodHJ1ZSk7XG5cbiAgICAgIH0sIGUgPT4ge1xuICAgICAgICB0aGlzLnJvdXRlckV2ZW50cy5uZXh0KG5ldyBOYXZpZ2F0aW9uRXJyb3IoaWQsIHVybCwgZSkpO1xuICAgICAgICByZWplY3RQcm9taXNlKGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgQ2FuQWN0aXZhdGUgeyBjb25zdHJ1Y3RvcihwdWJsaWMgcm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpIHt9fVxuY2xhc3MgQ2FuRGVhY3RpdmF0ZSB7IGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnQ6IE9iamVjdCwgcHVibGljIHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KSB7fX1cblxuY2xhc3MgR3VhcmRDaGVja3Mge1xuICBwcml2YXRlIGNoZWNrcyA9IFtdO1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGZ1dHVyZTogUm91dGVyU3RhdGVTbmFwc2hvdCwgcHJpdmF0ZSBjdXJyOiBSb3V0ZXJTdGF0ZVNuYXBzaG90LCBwcml2YXRlIGluamVjdG9yOiBJbmplY3Rvcikge31cblxuICBjaGVjayhwYXJlbnRPdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGZ1dHVyZVJvb3QgPSB0aGlzLmZ1dHVyZS5fcm9vdDtcbiAgICBjb25zdCBjdXJyUm9vdCA9IHRoaXMuY3VyciA/IHRoaXMuY3Vyci5fcm9vdCA6IG51bGw7XG4gICAgdGhpcy50cmF2ZXJzZUNoaWxkUm91dGVzKGZ1dHVyZVJvb3QsIGN1cnJSb290LCBwYXJlbnRPdXRsZXRNYXApO1xuICAgIGlmICh0aGlzLmNoZWNrcy5sZW5ndGggPT09IDApIHJldHVybiBvZih0cnVlKTtcbiAgICByZXR1cm4gZm9ya0pvaW4odGhpcy5jaGVja3MubWFwKHMgPT4ge1xuICAgICAgaWYgKHMgaW5zdGFuY2VvZiBDYW5BY3RpdmF0ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5DYW5BY3RpdmF0ZShzLnJvdXRlKVxuICAgICAgfSBlbHNlIGlmIChzIGluc3RhbmNlb2YgQ2FuRGVhY3RpdmF0ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5DYW5EZWFjdGl2YXRlKHMuY29tcG9uZW50LCBzLnJvdXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBiZSByZWFjaGVkXCIpO1xuICAgICAgfVxuICAgIH0pKS5tYXAoYW5kKTtcbiAgfVxuXG4gIHByaXZhdGUgdHJhdmVyc2VDaGlsZFJvdXRlcyhmdXR1cmVOb2RlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90PixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJOb2RlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90PiB8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCB8IG51bGwpOiB2b2lkIHtcbiAgICBjb25zdCBwcmV2Q2hpbGRyZW4gPSBub2RlQ2hpbGRyZW5Bc01hcChjdXJyTm9kZSk7XG4gICAgZnV0dXJlTm9kZS5jaGlsZHJlbi5mb3JFYWNoKGMgPT4ge1xuICAgICAgdGhpcy50cmF2ZXJzZVJvdXRlcyhjLCBwcmV2Q2hpbGRyZW5bYy52YWx1ZS5vdXRsZXRdLCBvdXRsZXRNYXApO1xuICAgICAgZGVsZXRlIHByZXZDaGlsZHJlbltjLnZhbHVlLm91dGxldF07XG4gICAgfSk7XG4gICAgZm9yRWFjaChwcmV2Q2hpbGRyZW4sICh2LCBrKSA9PiB0aGlzLmRlYWN0aXZhdGVPdXRsZXRBbmRJdENoaWxkcmVuKHYsIG91dGxldE1hcC5fb3V0bGV0c1trXSkpO1xuICB9XG5cbiAgdHJhdmVyc2VSb3V0ZXMoZnV0dXJlTm9kZTogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGVTbmFwc2hvdD4sIGN1cnJOb2RlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90PiB8IG51bGwsXG4gICAgICAgICAgICAgICAgIHBhcmVudE91dGxldE1hcDogUm91dGVyT3V0bGV0TWFwIHwgbnVsbCk6IHZvaWQge1xuICAgIGNvbnN0IGZ1dHVyZSA9IGZ1dHVyZU5vZGUudmFsdWU7XG4gICAgY29uc3QgY3VyciA9IGN1cnJOb2RlID8gY3Vyck5vZGUudmFsdWUgOiBudWxsO1xuICAgIGNvbnN0IG91dGxldCA9IHBhcmVudE91dGxldE1hcCA/IHBhcmVudE91dGxldE1hcC5fb3V0bGV0c1tmdXR1cmVOb2RlLnZhbHVlLm91dGxldF0gOiBudWxsO1xuXG4gICAgaWYgKGN1cnIgJiYgZnV0dXJlLl9yb3V0ZUNvbmZpZyA9PT0gY3Vyci5fcm91dGVDb25maWcpIHtcbiAgICAgIGlmICghc2hhbGxvd0VxdWFsKGZ1dHVyZS5wYXJhbXMsIGN1cnIucGFyYW1zKSkge1xuICAgICAgICB0aGlzLmNoZWNrcy5wdXNoKG5ldyBDYW5EZWFjdGl2YXRlKG91dGxldC5jb21wb25lbnQsIGN1cnIpLCBuZXcgQ2FuQWN0aXZhdGUoZnV0dXJlKSk7XG4gICAgICB9XG4gICAgICB0aGlzLnRyYXZlcnNlQ2hpbGRSb3V0ZXMoZnV0dXJlTm9kZSwgY3Vyck5vZGUsIG91dGxldCA/IG91dGxldC5vdXRsZXRNYXAgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWFjdGl2YXRlT3V0bGV0QW5kSXRDaGlsZHJlbihjdXJyLCBvdXRsZXQpO1xuICAgICAgdGhpcy5jaGVja3MucHVzaChuZXcgQ2FuQWN0aXZhdGUoZnV0dXJlKSk7XG4gICAgICB0aGlzLnRyYXZlcnNlQ2hpbGRSb3V0ZXMoZnV0dXJlTm9kZSwgbnVsbCwgb3V0bGV0ID8gb3V0bGV0Lm91dGxldE1hcCA6IG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGVhY3RpdmF0ZU91dGxldEFuZEl0Q2hpbGRyZW4ocm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIG91dGxldDogUm91dGVyT3V0bGV0KTogdm9pZCB7XG4gICAgaWYgKG91dGxldCAmJiBvdXRsZXQuaXNBY3RpdmF0ZWQpIHtcbiAgICAgIGZvckVhY2gob3V0bGV0Lm91dGxldE1hcC5fb3V0bGV0cywgKHYsIGspID0+IHRoaXMuZGVhY3RpdmF0ZU91dGxldEFuZEl0Q2hpbGRyZW4odiwgb3V0bGV0Lm91dGxldE1hcC5fb3V0bGV0c1trXSkpO1xuICAgICAgdGhpcy5jaGVja3MucHVzaChuZXcgQ2FuRGVhY3RpdmF0ZShvdXRsZXQuY29tcG9uZW50LCByb3V0ZSkpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBydW5DYW5BY3RpdmF0ZShmdXR1cmU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBjYW5BY3RpdmF0ZSA9IGZ1dHVyZS5fcm91dGVDb25maWcgPyBmdXR1cmUuX3JvdXRlQ29uZmlnLmNhbkFjdGl2YXRlIDogbnVsbDtcbiAgICBpZiAoIWNhbkFjdGl2YXRlIHx8IGNhbkFjdGl2YXRlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG9mKHRydWUpO1xuICAgIHJldHVybiBmb3JrSm9pbihjYW5BY3RpdmF0ZS5tYXAoYyA9PiB7XG4gICAgICBjb25zdCBndWFyZCA9IHRoaXMuaW5qZWN0b3IuZ2V0KGMpO1xuICAgICAgaWYgKGd1YXJkLmNhbkFjdGl2YXRlKSB7XG4gICAgICAgIHJldHVybiB3cmFwSW50b09ic2VydmFibGUoZ3VhcmQuY2FuQWN0aXZhdGUoZnV0dXJlLCB0aGlzLmZ1dHVyZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHdyYXBJbnRvT2JzZXJ2YWJsZShndWFyZChmdXR1cmUsIHRoaXMuZnV0dXJlKSk7XG4gICAgICB9XG4gICAgfSkpLm1hcChhbmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBydW5DYW5EZWFjdGl2YXRlKGNvbXBvbmVudDogT2JqZWN0LCBjdXJyOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgY29uc3QgY2FuRGVhY3RpdmF0ZSA9IGN1cnIuX3JvdXRlQ29uZmlnID8gY3Vyci5fcm91dGVDb25maWcuY2FuRGVhY3RpdmF0ZSA6IG51bGw7XG4gICAgaWYgKCFjYW5EZWFjdGl2YXRlIHx8IGNhbkRlYWN0aXZhdGUubGVuZ3RoID09PSAwKSByZXR1cm4gb2YodHJ1ZSk7XG4gICAgcmV0dXJuIGZvcmtKb2luKGNhbkRlYWN0aXZhdGUubWFwKGMgPT4ge1xuICAgICAgY29uc3QgZ3VhcmQgPSB0aGlzLmluamVjdG9yLmdldChjKTtcbiAgICAgIGlmIChndWFyZC5jYW5EZWFjdGl2YXRlKSB7XG4gICAgICAgIHJldHVybiB3cmFwSW50b09ic2VydmFibGUoZ3VhcmQuY2FuRGVhY3RpdmF0ZShjb21wb25lbnQsIGN1cnIsIHRoaXMuY3VycikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHdyYXBJbnRvT2JzZXJ2YWJsZShndWFyZChjb21wb25lbnQsIGN1cnIsIHRoaXMuY3VycikpO1xuICAgICAgfVxuICAgIH0pKS5tYXAoYW5kKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwSW50b09ic2VydmFibGU8VD4odmFsdWU6IFQgfCBPYnNlcnZhYmxlPFQ+KTogT2JzZXJ2YWJsZTxUPiB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE9ic2VydmFibGUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9mKHZhbHVlKTtcbiAgfVxufVxuXG5jbGFzcyBBY3RpdmF0ZVJvdXRlcyB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZnV0dXJlU3RhdGU6IFJvdXRlclN0YXRlLCBwcml2YXRlIGN1cnJTdGF0ZTogUm91dGVyU3RhdGUpIHt9XG5cbiAgYWN0aXZhdGUocGFyZW50T3V0bGV0TWFwOiBSb3V0ZXJPdXRsZXRNYXApOnZvaWQge1xuICAgIGNvbnN0IGZ1dHVyZVJvb3QgPSB0aGlzLmZ1dHVyZVN0YXRlLl9yb290O1xuICAgIGNvbnN0IGN1cnJSb290ID0gdGhpcy5jdXJyU3RhdGUgPyB0aGlzLmN1cnJTdGF0ZS5fcm9vdCA6IG51bGw7XG5cbiAgICBwdXNoUXVlcnlQYXJhbXNBbmRGcmFnbWVudCh0aGlzLmZ1dHVyZVN0YXRlKTtcbiAgICB0aGlzLmFjdGl2YXRlQ2hpbGRSb3V0ZXMoZnV0dXJlUm9vdCwgY3VyclJvb3QsIHBhcmVudE91dGxldE1hcCk7XG4gIH1cblxuICBwcml2YXRlIGFjdGl2YXRlQ2hpbGRSb3V0ZXMoZnV0dXJlTm9kZTogVHJlZU5vZGU8QWN0aXZhdGVkUm91dGU+LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyck5vZGU6IFRyZWVOb2RlPEFjdGl2YXRlZFJvdXRlPiB8IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCk6IHZvaWQge1xuICAgIGNvbnN0IHByZXZDaGlsZHJlbiA9IG5vZGVDaGlsZHJlbkFzTWFwKGN1cnJOb2RlKTtcbiAgICBmdXR1cmVOb2RlLmNoaWxkcmVuLmZvckVhY2goYyA9PiB7XG4gICAgICB0aGlzLmFjdGl2YXRlUm91dGVzKGMsIHByZXZDaGlsZHJlbltjLnZhbHVlLm91dGxldF0sIG91dGxldE1hcCk7XG4gICAgICBkZWxldGUgcHJldkNoaWxkcmVuW2MudmFsdWUub3V0bGV0XTtcbiAgICB9KTtcbiAgICBmb3JFYWNoKHByZXZDaGlsZHJlbiwgKHYsIGspID0+IHRoaXMuZGVhY3RpdmF0ZU91dGxldEFuZEl0Q2hpbGRyZW4ob3V0bGV0TWFwLl9vdXRsZXRzW2tdKSk7XG4gIH1cblxuICBhY3RpdmF0ZVJvdXRlcyhmdXR1cmVOb2RlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZT4sIGN1cnJOb2RlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZT4gfCBudWxsLFxuICAgICAgICAgICAgICAgICBwYXJlbnRPdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCk6IHZvaWQge1xuICAgIGNvbnN0IGZ1dHVyZSA9IGZ1dHVyZU5vZGUudmFsdWU7XG4gICAgY29uc3QgY3VyciA9IGN1cnJOb2RlID8gY3Vyck5vZGUudmFsdWUgOiBudWxsO1xuICAgIGNvbnN0IG91dGxldCA9IGdldE91dGxldChwYXJlbnRPdXRsZXRNYXAsIGZ1dHVyZU5vZGUudmFsdWUpO1xuXG4gICAgaWYgKGZ1dHVyZSA9PT0gY3Vycikge1xuICAgICAgYWR2YW5jZUFjdGl2YXRlZFJvdXRlKGZ1dHVyZSk7XG4gICAgICB0aGlzLmFjdGl2YXRlQ2hpbGRSb3V0ZXMoZnV0dXJlTm9kZSwgY3Vyck5vZGUsIG91dGxldC5vdXRsZXRNYXApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlYWN0aXZhdGVPdXRsZXRBbmRJdENoaWxkcmVuKG91dGxldCk7XG4gICAgICBjb25zdCBvdXRsZXRNYXAgPSBuZXcgUm91dGVyT3V0bGV0TWFwKCk7XG4gICAgICB0aGlzLmFjdGl2YXRlTmV3Um91dGVzKG91dGxldE1hcCwgZnV0dXJlLCBvdXRsZXQpO1xuICAgICAgdGhpcy5hY3RpdmF0ZUNoaWxkUm91dGVzKGZ1dHVyZU5vZGUsIG51bGwsIG91dGxldE1hcCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhY3RpdmF0ZU5ld1JvdXRlcyhvdXRsZXRNYXA6IFJvdXRlck91dGxldE1hcCwgZnV0dXJlOiBBY3RpdmF0ZWRSb3V0ZSwgb3V0bGV0OiBSb3V0ZXJPdXRsZXQpOiB2b2lkIHtcbiAgICBjb25zdCByZXNvbHZlZCA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtcbiAgICAgIHtwcm92aWRlOiBBY3RpdmF0ZWRSb3V0ZSwgdXNlVmFsdWU6IGZ1dHVyZX0sXG4gICAgICB7cHJvdmlkZTogUm91dGVyT3V0bGV0TWFwLCB1c2VWYWx1ZTogb3V0bGV0TWFwfVxuICAgIF0pO1xuICAgIG91dGxldC5hY3RpdmF0ZShmdXR1cmUuX2Z1dHVyZVNuYXBzaG90Ll9yZXNvbHZlZENvbXBvbmVudEZhY3RvcnksIHJlc29sdmVkLCBvdXRsZXRNYXApO1xuICAgIGFkdmFuY2VBY3RpdmF0ZWRSb3V0ZShmdXR1cmUpO1xuICB9XG5cbiAgcHJpdmF0ZSBkZWFjdGl2YXRlT3V0bGV0QW5kSXRDaGlsZHJlbihvdXRsZXQ6IFJvdXRlck91dGxldCk6IHZvaWQge1xuICAgIGlmIChvdXRsZXQgJiYgb3V0bGV0LmlzQWN0aXZhdGVkKSB7XG4gICAgICBmb3JFYWNoKG91dGxldC5vdXRsZXRNYXAuX291dGxldHMsICh2LCBrKSA9PiB0aGlzLmRlYWN0aXZhdGVPdXRsZXRBbmRJdENoaWxkcmVuKHYpKTtcbiAgICAgIG91dGxldC5kZWFjdGl2YXRlKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHB1c2hRdWVyeVBhcmFtc0FuZEZyYWdtZW50KHN0YXRlOiBSb3V0ZXJTdGF0ZSk6IHZvaWQge1xuICBpZiAoIXNoYWxsb3dFcXVhbChzdGF0ZS5zbmFwc2hvdC5xdWVyeVBhcmFtcywgKDxhbnk+c3RhdGUucXVlcnlQYXJhbXMpLnZhbHVlKSkge1xuICAgICg8YW55PnN0YXRlLnF1ZXJ5UGFyYW1zKS5uZXh0KHN0YXRlLnNuYXBzaG90LnF1ZXJ5UGFyYW1zKTtcbiAgfVxuXG4gIGlmIChzdGF0ZS5zbmFwc2hvdC5mcmFnbWVudCAhPT0gKDxhbnk+c3RhdGUuZnJhZ21lbnQpLnZhbHVlKSB7XG4gICAgKDxhbnk+c3RhdGUuZnJhZ21lbnQpLm5leHQoc3RhdGUuc25hcHNob3QuZnJhZ21lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vZGVDaGlsZHJlbkFzTWFwKG5vZGU6IFRyZWVOb2RlPGFueT58bnVsbCkge1xuICByZXR1cm4gbm9kZSA/XG4gICAgbm9kZS5jaGlsZHJlbi5yZWR1Y2UoXG4gICAgICAobSwgYykgPT4ge1xuICAgICAgICBtW2MudmFsdWUub3V0bGV0XSA9IGM7XG4gICAgICAgIHJldHVybiBtO1xuICAgICAgfSxcbiAgICAgIHt9KSA6XG4gIHt9O1xufVxuXG5mdW5jdGlvbiBnZXRPdXRsZXQob3V0bGV0TWFwOiBSb3V0ZXJPdXRsZXRNYXAsIHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZSk6IFJvdXRlck91dGxldCB7XG4gIGxldCBvdXRsZXQgPSBvdXRsZXRNYXAuX291dGxldHNbcm91dGUub3V0bGV0XTtcbiAgaWYgKCFvdXRsZXQpIHtcbiAgICBpZiAocm91dGUub3V0bGV0ID09PSBQUklNQVJZX09VVExFVCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCBwcmltYXJ5IG91dGxldGApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kIHRoZSBvdXRsZXQgJHtyb3V0ZS5vdXRsZXR9YCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXRsZXQ7XG59XG4iXX0=