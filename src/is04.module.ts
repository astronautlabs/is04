import { Module } from "@alterior/di";
import { QueryService } from "./query.service";
import { RegistryService } from "./registry.service";

@Module({
    providers: [
        RegistryService,
        QueryService
    ]
})
export class IS04Module {

}