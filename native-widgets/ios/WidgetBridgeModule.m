#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridgeModule, NSObject)

RCT_EXTERN_METHOD(updateWidgetData:(NSDictionary *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

