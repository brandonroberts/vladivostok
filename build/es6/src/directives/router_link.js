var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Directive, HostListener, HostBinding, Input } from '@angular/core';
import { Router } from '../router';
import { ActivatedRoute } from '../router_state';
export let RouterLink = class RouterLink {
    constructor(router, route) {
        this.router = router;
        this.route = route;
        this.commands = [];
    }
    set routerLink(data) {
        if (Array.isArray(data)) {
            this.commands = data;
        }
        else {
            this.commands = [data];
        }
    }
    ngOnChanges(changes) {
        this.updateTargetUrlAndHref();
    }
    onClick() {
        if (!(typeof this.target === "string") || this.target == '_self') {
            this.router.navigate(this.commands, {
                relativeTo: this.route,
                queryParams: this.queryParams,
                fragment: this.fragment
            });
            return false;
        }
        return true;
    }
    updateTargetUrlAndHref() {
        const tree = this.router.createUrlTree(this.commands, {
            relativeTo: this.route,
            queryParams: this.queryParams,
            fragment: this.fragment
        });
        if (tree) {
            this.href = this.router.serializeUrl(tree);
        }
    }
};
__decorate([
    Input(), 
    __metadata('design:type', String)
], RouterLink.prototype, "target", void 0);
__decorate([
    Input(), 
    __metadata('design:type', Object)
], RouterLink.prototype, "queryParams", void 0);
__decorate([
    Input(), 
    __metadata('design:type', String)
], RouterLink.prototype, "fragment", void 0);
__decorate([
    HostBinding(), 
    __metadata('design:type', String)
], RouterLink.prototype, "href", void 0);
__decorate([
    Input(), 
    __metadata('design:type', Object), 
    __metadata('design:paramtypes', [Object])
], RouterLink.prototype, "routerLink", null);
__decorate([
    HostListener("click"), 
    __metadata('design:type', Function), 
    __metadata('design:paramtypes', []), 
    __metadata('design:returntype', Boolean)
], RouterLink.prototype, "onClick", null);
RouterLink = __decorate([
    Directive({ selector: '[routerLink]' }), 
    __metadata('design:paramtypes', [Router, ActivatedRoute])
], RouterLink);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX2xpbmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZGlyZWN0aXZlcy9yb3V0ZXJfbGluay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7T0FBTyxFQUNMLFNBQVMsRUFDVCxZQUFZLEVBQ1osV0FBVyxFQUNYLEtBQUssRUFFTixNQUFNLGVBQWU7T0FDZixFQUFDLE1BQU0sRUFBQyxNQUFNLFdBQVc7T0FDekIsRUFBQyxjQUFjLEVBQUMsTUFBTSxpQkFBaUI7QUE0QjlDO0lBWUUsWUFBb0IsTUFBYyxFQUFVLEtBQXFCO1FBQTdDLFdBQU0sR0FBTixNQUFNLENBQVE7UUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFnQjtRQVZ6RCxhQUFRLEdBQVUsRUFBRSxDQUFDO0lBVXVDLENBQUM7SUFHckUsSUFBSSxVQUFVLENBQUMsSUFBb0I7UUFDakMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFFBQVEsR0FBUSxJQUFJLENBQUM7UUFDNUIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVyxDQUFDLE9BQVU7UUFDcEIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUdELE9BQU87UUFFTCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNsQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ3RCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2FBQ3hCLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDZixDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTyxzQkFBc0I7UUFDNUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNwRCxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDdEIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtTQUN4QixDQUFDLENBQUM7UUFDSCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QyxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUM7QUFsREM7SUFBQyxLQUFLLEVBQUU7OzBDQUFBO0FBRVI7SUFBQyxLQUFLLEVBQUU7OytDQUFBO0FBQ1I7SUFBQyxLQUFLLEVBQUU7OzRDQUFBO0FBR1I7SUFBQyxXQUFXLEVBQUU7O3dDQUFBO0FBT2Q7SUFBQyxLQUFLLEVBQUU7Ozs0Q0FBQTtBQWFSO0lBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQzs7Ozt5Q0FBQTtBQTVCeEI7SUFBQyxTQUFTLENBQUMsRUFBQyxRQUFRLEVBQUUsY0FBYyxFQUFDLENBQUM7O2NBQUE7QUFvRHJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBIb3N0TGlzdGVuZXIsXG4gIEhvc3RCaW5kaW5nLFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtSb3V0ZXJ9IGZyb20gJy4uL3JvdXRlcic7XG5pbXBvcnQge0FjdGl2YXRlZFJvdXRlfSBmcm9tICcuLi9yb3V0ZXJfc3RhdGUnO1xuXG4vKipcbiAqIFRoZSBSb3V0ZXJMaW5rIGRpcmVjdGl2ZSBsZXRzIHlvdSBsaW5rIHRvIHNwZWNpZmljIHBhcnRzIG9mIHlvdXIgYXBwLlxuICpcbiAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgcm91dGUgY29uZmlndXJhdGlvbjpcblxuICogYGBgXG4gKiBbeyBwYXRoOiAnL3VzZXInLCBjb21wb25lbnQ6IFVzZXJDbXAgfV1cbiAqIGBgYFxuICpcbiAqIFdoZW4gbGlua2luZyB0byB0aGlzIGBVc2VyYCByb3V0ZSwgeW91IGNhbiB3cml0ZTpcbiAqXG4gKiBgYGBcbiAqIDxhIFtyb3V0ZXJMaW5rXT1cIlsnL3VzZXInXVwiPmxpbmsgdG8gdXNlciBjb21wb25lbnQ8L2E+XG4gKiBgYGBcbiAqXG4gKiBSb3V0ZXJMaW5rIGV4cGVjdHMgdGhlIHZhbHVlIHRvIGJlIGFuIGFycmF5IG9mIHBhdGggc2VnbWVudHMsIGZvbGxvd2VkIGJ5IHRoZSBwYXJhbXNcbiAqIGZvciB0aGF0IGxldmVsIG9mIHJvdXRpbmcuIEZvciBpbnN0YW5jZSBgWycvdGVhbScsIHt0ZWFtSWQ6IDF9LCAndXNlcicsIHt1c2VySWQ6IDJ9XWBcbiAqIG1lYW5zIHRoYXQgd2Ugd2FudCB0byBnZW5lcmF0ZSBhIGxpbmsgdG8gYC90ZWFtO3RlYW1JZD0xL3VzZXI7dXNlcklkPTJgLlxuICpcbiAqIFRoZSBmaXJzdCBzZWdtZW50IG5hbWUgY2FuIGJlIHByZXBlbmRlZCB3aXRoIGAvYCwgYC4vYCwgb3IgYC4uL2AuXG4gKiBJZiB0aGUgc2VnbWVudCBiZWdpbnMgd2l0aCBgL2AsIHRoZSByb3V0ZXIgd2lsbCBsb29rIHVwIHRoZSByb3V0ZSBmcm9tIHRoZSByb290IG9mIHRoZSBhcHAuXG4gKiBJZiB0aGUgc2VnbWVudCBiZWdpbnMgd2l0aCBgLi9gLCBvciBkb2Vzbid0IGJlZ2luIHdpdGggYSBzbGFzaCwgdGhlIHJvdXRlciB3aWxsXG4gKiBpbnN0ZWFkIGxvb2sgaW4gdGhlIGN1cnJlbnQgY29tcG9uZW50J3MgY2hpbGRyZW4gZm9yIHRoZSByb3V0ZS5cbiAqIEFuZCBpZiB0aGUgc2VnbWVudCBiZWdpbnMgd2l0aCBgLi4vYCwgdGhlIHJvdXRlciB3aWxsIGdvIHVwIG9uZSBsZXZlbC5cbiAqL1xuQERpcmVjdGl2ZSh7c2VsZWN0b3I6ICdbcm91dGVyTGlua10nfSlcbmV4cG9ydCBjbGFzcyBSb3V0ZXJMaW5rIGltcGxlbWVudHMgT25DaGFuZ2VzIHtcbiAgQElucHV0KCkgdGFyZ2V0OiBzdHJpbmc7XG4gIHByaXZhdGUgY29tbWFuZHM6IGFueVtdID0gW107XG4gIEBJbnB1dCgpIHF1ZXJ5UGFyYW1zOiB7W2s6c3RyaW5nXTphbnl9O1xuICBASW5wdXQoKSBmcmFnbWVudDogc3RyaW5nO1xuXG4gIC8vIHRoZSB1cmwgZGlzcGxheWVkIG9uIHRoZSBhbmNob3IgZWxlbWVudC5cbiAgQEhvc3RCaW5kaW5nKCkgaHJlZjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm91dGVyOiBSb3V0ZXIsIHByaXZhdGUgcm91dGU6IEFjdGl2YXRlZFJvdXRlKSB7fVxuXG4gIEBJbnB1dCgpXG4gIHNldCByb3V0ZXJMaW5rKGRhdGE6IGFueVtdIHwgc3RyaW5nKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgIHRoaXMuY29tbWFuZHMgPSA8YW55PmRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29tbWFuZHMgPSBbZGF0YV07XG4gICAgfVxuICB9XG5cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczp7fSk6YW55IHtcbiAgICB0aGlzLnVwZGF0ZVRhcmdldFVybEFuZEhyZWYoKTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoXCJjbGlja1wiKVxuICBvbkNsaWNrKCk6IGJvb2xlYW4ge1xuICAgIC8vIElmIG5vIHRhcmdldCwgb3IgaWYgdGFyZ2V0IGlzIF9zZWxmLCBwcmV2ZW50IGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvclxuICAgIGlmICghKHR5cGVvZiB0aGlzLnRhcmdldCA9PT0gXCJzdHJpbmdcIikgfHwgdGhpcy50YXJnZXQgPT0gJ19zZWxmJykge1xuICAgICAgdGhpcy5yb3V0ZXIubmF2aWdhdGUodGhpcy5jb21tYW5kcywge1xuICAgICAgICByZWxhdGl2ZVRvOiB0aGlzLnJvdXRlLFxuICAgICAgICBxdWVyeVBhcmFtczogdGhpcy5xdWVyeVBhcmFtcyxcbiAgICAgICAgZnJhZ21lbnQ6IHRoaXMuZnJhZ21lbnRcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlVGFyZ2V0VXJsQW5kSHJlZigpOiB2b2lkIHtcbiAgICBjb25zdCB0cmVlID0gdGhpcy5yb3V0ZXIuY3JlYXRlVXJsVHJlZSh0aGlzLmNvbW1hbmRzLCB7XG4gICAgICByZWxhdGl2ZVRvOiB0aGlzLnJvdXRlLFxuICAgICAgcXVlcnlQYXJhbXM6IHRoaXMucXVlcnlQYXJhbXMsXG4gICAgICBmcmFnbWVudDogdGhpcy5mcmFnbWVudFxuICAgIH0pO1xuICAgIGlmICh0cmVlKSB7XG4gICAgICB0aGlzLmhyZWYgPSB0aGlzLnJvdXRlci5zZXJpYWxpemVVcmwodHJlZSk7XG4gICAgfVxuICB9XG59XG4iXX0=