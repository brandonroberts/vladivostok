"use strict";
var router_outlet_map_1 = require('./router_outlet_map');
var url_serializer_1 = require('./url_serializer');
var router_state_1 = require('./router_state');
var router_1 = require('./router');
var core_1 = require('@angular/core');
var common_1 = require('@angular/common');
function provideRouter(config) {
    return [
        common_1.Location,
        { provide: common_1.LocationStrategy, useClass: common_1.PathLocationStrategy },
        { provide: url_serializer_1.UrlSerializer, useClass: url_serializer_1.DefaultUrlSerializer },
        {
            provide: router_1.Router,
            useFactory: function (ref, resolver, urlSerializer, outletMap, location, injector) {
                if (ref.componentTypes.length == 0) {
                    throw new Error("Bootstrap at least one component before injecting Router.");
                }
                var componentType = ref.componentTypes[0];
                var r = new router_1.Router(componentType, resolver, urlSerializer, outletMap, location, injector, config);
                ref.registerDisposeListener(function () { return r.dispose(); });
                return r;
            },
            deps: [core_1.ApplicationRef, core_1.ComponentResolver, url_serializer_1.UrlSerializer, router_outlet_map_1.RouterOutletMap, common_1.Location, core_1.Injector]
        },
        router_outlet_map_1.RouterOutletMap,
        { provide: router_state_1.ActivatedRoute, useFactory: function (r) { return r.routerState.root; }, deps: [router_1.Router] },
        { provide: core_1.APP_INITIALIZER, multi: true, useFactory: function (router) { return router.initialNavigation(); }, deps: [router_1.Router] },
    ];
}
exports.provideRouter = provideRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uX3JvdXRlcl9wcm92aWRlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbW9uX3JvdXRlcl9wcm92aWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFnQyxxQkFBcUIsQ0FBQyxDQUFBO0FBQ3RELCtCQUFvRCxrQkFBa0IsQ0FBQyxDQUFBO0FBQ3ZFLDZCQUErQixnQkFBZ0IsQ0FBQyxDQUFBO0FBQ2hELHVCQUF1QixVQUFVLENBQUMsQ0FBQTtBQUVsQyxxQkFBNkUsZUFBZSxDQUFDLENBQUE7QUFDN0YsdUJBQWlFLGlCQUFpQixDQUFDLENBQUE7QUFvQm5GLHVCQUE4QixNQUFvQjtJQUNoRCxNQUFNLENBQUM7UUFDTCxpQkFBUTtRQUNSLEVBQUMsT0FBTyxFQUFFLHlCQUFnQixFQUFFLFFBQVEsRUFBRSw2QkFBb0IsRUFBQztRQUMzRCxFQUFDLE9BQU8sRUFBRSw4QkFBYSxFQUFFLFFBQVEsRUFBRSxxQ0FBb0IsRUFBQztRQUV4RDtZQUNFLE9BQU8sRUFBRSxlQUFNO1lBQ2YsVUFBVSxFQUFFLFVBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRO2dCQUN0RSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLDJEQUEyRCxDQUFDLENBQUM7Z0JBQy9FLENBQUM7Z0JBQ0QsSUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsSUFBTSxDQUFDLEdBQUcsSUFBSSxlQUFNLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BHLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxjQUFNLE9BQUEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFYLENBQVcsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUNELElBQUksRUFBRSxDQUFDLHFCQUFjLEVBQUUsd0JBQWlCLEVBQUUsOEJBQWEsRUFBRSxtQ0FBZSxFQUFFLGlCQUFRLEVBQUUsZUFBUSxDQUFDO1NBQzlGO1FBRUQsbUNBQWU7UUFDZixFQUFDLE9BQU8sRUFBRSw2QkFBYyxFQUFFLFVBQVUsRUFBRSxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFsQixDQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLGVBQU0sQ0FBQyxFQUFDO1FBR2hGLEVBQUMsT0FBTyxFQUFFLHNCQUFlLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBQyxNQUFjLElBQUssT0FBQSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsRUFBMUIsQ0FBMEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxlQUFNLENBQUMsRUFBQztLQUNwSCxDQUFDO0FBQ0osQ0FBQztBQTFCZSxxQkFBYSxnQkEwQjVCLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSb3V0ZXJPdXRsZXRNYXAgfSBmcm9tICcuL3JvdXRlcl9vdXRsZXRfbWFwJztcbmltcG9ydCB7IFVybFNlcmlhbGl6ZXIsIERlZmF1bHRVcmxTZXJpYWxpemVyIH0gZnJvbSAnLi91cmxfc2VyaWFsaXplcic7XG5pbXBvcnQgeyBBY3RpdmF0ZWRSb3V0ZSB9IGZyb20gJy4vcm91dGVyX3N0YXRlJztcbmltcG9ydCB7IFJvdXRlciB9IGZyb20gJy4vcm91dGVyJztcbmltcG9ydCB7IFJvdXRlckNvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IENvbXBvbmVudFJlc29sdmVyLCBBcHBsaWNhdGlvblJlZiwgSW5qZWN0b3IsIEFQUF9JTklUSUFMSVpFUiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTG9jYXRpb25TdHJhdGVneSwgUGF0aExvY2F0aW9uU3RyYXRlZ3ksIExvY2F0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuLyoqXG4gKiBBIGxpc3Qgb2Yge0BsaW5rIFByb3ZpZGVyfXMuIFRvIHVzZSB0aGUgcm91dGVyLCB5b3UgbXVzdCBhZGQgdGhpcyB0byB5b3VyIGFwcGxpY2F0aW9uLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBAQ29tcG9uZW50KHtkaXJlY3RpdmVzOiBbUk9VVEVSX0RJUkVDVElWRVNdfSlcbiAqIGNsYXNzIEFwcENtcCB7XG4gKiAgIC8vIC4uLlxuICogfVxuICpcbiAqIGNvbnN0IHJvdXRlciA9IFtcbiAqICAge3BhdGg6ICcvaG9tZScsIGNvbXBvbmVudDogSG9tZX1cbiAqIF07XG4gKlxuICogYm9vdHN0cmFwKEFwcENtcCwgW3Byb3ZpZGVSb3V0ZXIocm91dGVyKV0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlUm91dGVyKGNvbmZpZzogUm91dGVyQ29uZmlnKTphbnlbXSB7XG4gIHJldHVybiBbXG4gICAgTG9jYXRpb24sXG4gICAge3Byb3ZpZGU6IExvY2F0aW9uU3RyYXRlZ3ksIHVzZUNsYXNzOiBQYXRoTG9jYXRpb25TdHJhdGVneX0sXG4gICAge3Byb3ZpZGU6IFVybFNlcmlhbGl6ZXIsIHVzZUNsYXNzOiBEZWZhdWx0VXJsU2VyaWFsaXplcn0sXG5cbiAgICB7XG4gICAgICBwcm92aWRlOiBSb3V0ZXIsXG4gICAgICB1c2VGYWN0b3J5OiAocmVmLCByZXNvbHZlciwgdXJsU2VyaWFsaXplciwgb3V0bGV0TWFwLCBsb2NhdGlvbiwgaW5qZWN0b3IpID0+IHtcbiAgICAgICAgaWYgKHJlZi5jb21wb25lbnRUeXBlcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJvb3RzdHJhcCBhdCBsZWFzdCBvbmUgY29tcG9uZW50IGJlZm9yZSBpbmplY3RpbmcgUm91dGVyLlwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb21wb25lbnRUeXBlID0gcmVmLmNvbXBvbmVudFR5cGVzWzBdO1xuICAgICAgICBjb25zdCByID0gbmV3IFJvdXRlcihjb21wb25lbnRUeXBlLCByZXNvbHZlciwgdXJsU2VyaWFsaXplciwgb3V0bGV0TWFwLCBsb2NhdGlvbiwgaW5qZWN0b3IsIGNvbmZpZyk7XG4gICAgICAgIHJlZi5yZWdpc3RlckRpc3Bvc2VMaXN0ZW5lcigoKSA9PiByLmRpc3Bvc2UoKSk7XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfSxcbiAgICAgIGRlcHM6IFtBcHBsaWNhdGlvblJlZiwgQ29tcG9uZW50UmVzb2x2ZXIsIFVybFNlcmlhbGl6ZXIsIFJvdXRlck91dGxldE1hcCwgTG9jYXRpb24sIEluamVjdG9yXVxuICAgIH0sXG5cbiAgICBSb3V0ZXJPdXRsZXRNYXAsXG4gICAge3Byb3ZpZGU6IEFjdGl2YXRlZFJvdXRlLCB1c2VGYWN0b3J5OiAocikgPT4gci5yb3V0ZXJTdGF0ZS5yb290LCBkZXBzOiBbUm91dGVyXX0sXG4gICAgXG4gICAgLy8gVHJpZ2dlciBpbml0aWFsIG5hdmlnYXRpb25cbiAgICB7cHJvdmlkZTogQVBQX0lOSVRJQUxJWkVSLCBtdWx0aTogdHJ1ZSwgdXNlRmFjdG9yeTogKHJvdXRlcjogUm91dGVyKSA9PiByb3V0ZXIuaW5pdGlhbE5hdmlnYXRpb24oKSwgZGVwczogW1JvdXRlcl19LFxuICBdO1xufVxuIl19