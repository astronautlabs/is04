import { Module } from "@alterior/di";
import { RegistryService } from "./registry.service";

@Module({
    providers: [
        RegistryService
    ]
})
export class IS04Module {

}